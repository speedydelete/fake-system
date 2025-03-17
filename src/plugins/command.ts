import {DeviceExecutor} from '../fs';
import {System, Process, UserSession} from '../index';
import {BashUserSession, BashProcess} from './bash';


export type RequiredArgument<Name extends string = string> = `${Name}`;
export type OptionalArgument<Name extends string = string> = `[${Name}]`;
export type VariadicArgument<Name extends string = string> = `${Name}...`;
export type Argument<Name extends string = string> = RequiredArgument<Name> | OptionalArgument<Name> | VariadicArgument<Name>;

export type BooleanOption<Name extends string = string> = `-${Name}`;
export type OptionWithRequiredArgument<Name extends string = string, Arg extends string = string> = `${BooleanOption<Name>}=${RequiredArgument<Arg>}`;
export type OptionWithOptionalArgument<Name extends string = string, Arg extends string = string> = `${BooleanOption<Name>}=${OptionalArgument<Arg>}`;
export type Option<Name extends string = string> = BooleanOption<Name> | OptionWithRequiredArgument<Name> | OptionWithOptionalArgument<Name>;

export type ChangeNameOfOption<Opt extends Option, Name extends string> = Opt extends `-${infer OldName}=[${infer Arg}]` ? OptionWithOptionalArgument<`-${Name}`, Arg> : (Opt extends `-${infer OldName}=${infer Arg}` ? OptionWithRequiredArgument<`-${Name}`, Arg> : (Opt extends `-${infer OldName}` ? BooleanOption<Name> : never));

export type ParsedRequiredArgument<Name extends string = string> = {name: Uppercase<Name>, key: Lowercase<Name>, optional: false, variadic: false, synopsis: string};
export type ParsedOptionalArgument<Name extends string = string> = {name: Uppercase<Name>, key: Lowercase<Name>, optional: true, variadic: false, synopsis: string};
export type ParsedVariadicArgument<Name extends string = string> = {name: Uppercase<Name>, key: Lowercase<Name>, optional: false, variadic: true, synopsis: string};
export type ParsedArgument<Name extends string = string> = ParsedRequiredArgument<Name> | ParsedOptionalArgument<Name> | ParsedVariadicArgument<Name>;

export type ParsedBooleanOption<Name extends string = string, LongName extends string | undefined = undefined> = {name: Name, longName?: LongName, arg: null, argIsOptional: null, description?: string};
export type ParsedOptionWithRequiredArgument<Name extends string = string, Arg extends string = string, LongName extends string | undefined = undefined> = {name: Name, longName?: LongName, arg: Uppercase<Arg>, argIsOptional: false, description?: string};
export type ParsedOptionWithOptionalArgument<Name extends string = string, Arg extends string = string, LongName extends string | undefined = undefined> = {name: Name, longName?: LongName, arg: Uppercase<Arg>, argIsOptional: true, description?: string};
export type ParsedOption<Name extends string = string, LongName extends string | undefined = string | undefined> = ParsedBooleanOption<Name, LongName> | ParsedOptionWithRequiredArgument<Name, string, LongName> | ParsedOptionWithOptionalArgument<Name, string, LongName>;

export type ArgumentToParsedArgument<Arg extends Argument> = Arg extends `[${infer Name}]` ? ParsedOptionalArgument<Name> : (Arg extends `${infer Name}...` ? ParsedVariadicArgument<Name> : ParsedRequiredArgument<Arg>);
export type OptionToParsedOption<Opt extends Option, LongName extends string | undefined = undefined> = Opt extends `-${'-' | ''}${infer Name}=[${infer Arg}]` ? ParsedOptionWithOptionalArgument<Name, Arg, LongName> : (Opt extends `-${'-' | ''}${infer Name}=${infer Arg}` ? ParsedOptionWithRequiredArgument<Name, Arg, LongName> : (Opt extends `-${'-' | ''}${infer Name}` ? ParsedBooleanOption<Name, LongName> : ParsedBooleanOption<Opt>));

type PreserveCaseFirst<S extends string> = S extends Uppercase<S> ? Uppercase<S>  : Lowercase<S>;
type CamelCase<S extends string> = S extends `-${infer Rest}` ? CamelCase<Rest> : S extends `${infer First}-${infer Rest}` ? `${PreserveCaseFirst<First>}${Capitalize<CamelCase<Rest>>}` : PreserveCaseFirst<S>;

export type ParsedArguments<Args extends ParsedArgument[], Opts extends ParsedOption[]> = {[Arg in Args[number] as Lowercase<Arg['name']>]: Arg extends ParsedRequiredArgument ? string : (Arg extends ParsedOptionalArgument ? string | undefined : (Arg extends ParsedVariadicArgument ? string[] : never))} & {[Opt in Opts[number] as CamelCase<Opt['name']>]: Opt extends ParsedBooleanOption ? boolean : (Opt extends ParsedOptionWithOptionalArgument ? string | true | undefined : (Opt extends ParsedOptionWithRequiredArgument ? string | undefined : (Opt['arg'] extends null ? boolean : string | undefined)))};

export type CommandFunction<Args extends ParsedArgument[], Opts extends ParsedOption[]> = (options: {args: ParsedArguments<Args, Opts>, process: BashProcess, session: BashUserSession, system: System, error(message: string): void, suppressErrors(suppress?: boolean): void}) => void;


export class ArgumentParsingError<Args extends ParsedArgument[], Opts extends ParsedOption[]> extends Error {

    [Symbol.toStringTag] = 'ArgumentParsingError';
    cmd: Command<Args, Opts>;

    constructor(cmd: Command<Args, Opts>, msg: string) {
        super(msg);
        this.cmd = cmd;
    }

    toString() {
        return this.cmd.name + ': ' + this.message;
    }

}


export class CommandError extends Error {};


function flagToCamelCase(flag: string): string {
    let out = '';
    for (let i = 0; i < flag.length; i++) {
        let char = flag[i];
        if (out === '' && char === '-') {
            continue;
        }
        if (char === '-') {
            i++;
            out += flag[i].toUpperCase();
        } else {
            out += char;
        }
    }
    return out;
}

export class Command<Args extends ParsedArgument[] = [], Opts extends ParsedOption[] = []> {

    name: string;
    description: string;
    args: Args = [] as unknown as Args;
    options: Opts = [] as unknown as Opts;
    optionsForParsing: Map<string, {key: string, hasArg: boolean, argIsOptional: boolean}> = new Map();

    constructor(name: string, description: string) {
        this.name = name;
        this.description = description;
    }

    func(func: CommandFunction<Args, Opts>): DeviceExecutor {
        let requiredArgs = [];
        let optionalArgs = [];
        let variadicArgs = [];
        for (let arg of this.args) {
            if (arg.optional) {
                optionalArgs.push(arg);
            } else if (arg.variadic) {
                variadicArgs.push(arg);
            } else {
                requiredArgs.push(arg);
            }
        }
        return (process: Process, session: UserSession) =>  {
            let parsed = this.parse((process as BashProcess).argv, requiredArgs, optionalArgs, variadicArgs);
            if (typeof parsed === 'string') {
                process.stdout.write(parsed + '\n');
            } else {
                let suppressed = false;
                function error(message: string) {
                    if (!suppressed) {
                        throw new CommandError(message);
                    }
                }
                function suppressErrors(suppress: boolean = true) {
                    suppressed = suppress;
                }
                try {
                    func({args: parsed, process: process as BashProcess, session: session as BashUserSession, system: session.system, error, suppressErrors});
                } catch (error) {
                    process.stderr.write(`${this.name}: error: `);
                    if (error instanceof Error) {
                        if (error instanceof CommandError) {
                            process.stderr.write(error.message);
                        } else {
                            if ((session as BashUserSession).throwUnintentionalCommandErrors) {
                                throw error;
                            } else {
                                process.stderr.write(error.stack ?? String(error));
                            }
                        }
                    } else {
                        process.stderr.write(String(error));
                    }
                }
            }
        };
    }

    argument<T extends Argument>(arg: T, synopsis?: string): Command<[...Args, ArgumentToParsedArgument<T>], Opts> {
        if (arg.startsWith('[') && arg.endsWith(']')) {
            let name = arg.slice(1, -1).toUpperCase() as Uppercase<string>;
            let key = name.toLowerCase() as Lowercase<string>;
            this.args.push({name, key, optional: true, variadic: false, synopsis: synopsis ?? `[${name}]`});
        } else if (arg.endsWith('...')) {
            let name = arg.slice(0, -3).toUpperCase() as Uppercase<string>;
            let key = name.toLowerCase() as Lowercase<string>;
            this.args.push({name, key, optional: false, variadic: true, synopsis: synopsis ?? `${name}...`});
        } else {
            let name = arg.toUpperCase() as Uppercase<string>;
            let key = name.toLowerCase() as Lowercase<string>;
            this.args.push({name, key, optional: false, variadic: false, synopsis: synopsis ?? name});
        }
        return this as unknown as Command<[...Args, ArgumentToParsedArgument<T>], Opts>;
    }

    option<T extends Option, LongName extends string>(name: T, longName: ChangeNameOfOption<T, LongName>, description?: string): Command<Args, [...Opts, OptionToParsedOption<T, LongName>]>;
    option<T extends Option>(name: T, description?: string): Command<Args, [...Opts, OptionToParsedOption<T>]>;
    option<T extends Option, LongName extends string | undefined = undefined>(name: T, descriptionOrLongName: LongName extends `${infer Name}` ? ChangeNameOfOption<T, Name> : string, description?: string): Command<Args, [...Opts, OptionToParsedOption<T, LongName>]> {
        let longName: string | undefined;
        if (description === undefined) {
            if (descriptionOrLongName.startsWith('--')) {
                description = '';
                longName = descriptionOrLongName;
            } else {
                description = descriptionOrLongName;
            }
        } else {
            longName = descriptionOrLongName;
        }
        let arg = null;
        let argIsOptional = false;
        if (name.includes('=')) {
            let parts = name.split('=');
            // @ts-ignore
            name = parts[0];
            let arg: string;
            let argIsOptional: boolean;
            if (parts[1].startsWith('[') && parts[1].endsWith(']')) {
                arg = parts[1].slice(1, -1);
                argIsOptional = true;
            } else {
                arg = parts[1];
                argIsOptional = false;
            }
            this.options.push({name, longName, arg: arg.toUpperCase() as Uppercase<string>, argIsOptional, description});
        } else {
            this.options.push({name, longName, arg: null, argIsOptional: null, description});
        }
        let key = flagToCamelCase(name);
        this.optionsForParsing.set(name.replace(/^--?/, ''), {key, hasArg: arg !== null, argIsOptional});
        if (longName !== undefined) {
            this.optionsForParsing.set(longName.replace(/^--?/, ''), {key, hasArg: arg !== null, argIsOptional});
        }
        return this as unknown as Command<Args, [...Opts, OptionToParsedOption<T, LongName>]>;
    }

    parse(argv: string[], requiredArgs: ParsedRequiredArgument[], optionalArgs: ParsedOptionalArgument[], variadicArgs: ParsedVariadicArgument[]): ParsedArguments<Args, Opts> | string {
        argv = argv.slice(1);
        let out: {[key: string]: unknown} = {};
        let posArgs = [];
        for (let i = 0; i < argv.length; i++) {
            let arg = argv[i];
            if (arg.startsWith('-')) {
                let [_flags, flagArg] = arg.split('=');
                let flags = _flags.startsWith('--') ? [_flags.slice(2)] : _flags.slice(1);
                for (let flag of flags) {
                    let option = this.optionsForParsing.get(flag);
                    if (option === undefined) {
                        if (flag === 'h' || flag === 'help') {
                            return this.getHelpMessage();
                        } else {
                            throw new ArgumentParsingError(this, `unrecognized flag ${flag}`);
                        }
                    } else {
                        let {key, hasArg, argIsOptional} = option;
                        if (hasArg) {
                            if (flagArg === undefined) {
                                if (i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
                                    out[key] = argv[++i];
                                } else if (!argIsOptional) {
                                    throw new ArgumentParsingError(this, `flag ${arg} requires an argument`);
                                } else {
                                    out[key] = true;
                                }
                            } else {
                                out[key] = flagArg;
                            }
                        } else if (flagArg !== undefined) {
                            throw new ArgumentParsingError(this, `flag ${arg} does not take an argument`);
                        } else {
                            out[key] = true;
                        }
                    }
                }
            } else {
                posArgs.push(arg);
            }
        }
        if (posArgs.length < requiredArgs.length) {
            throw new ArgumentParsingError(this, `missing required argument '${requiredArgs[posArgs.length].name}'`);
        }
        let currentPos = 0;
        for (let arg of requiredArgs) {
            out[arg.key] = posArgs[currentPos++];
        }
        if (variadicArgs.length > 0) {
            const variadicArg = variadicArgs[0];
            const remainingArgs = posArgs.slice(currentPos);
            out[variadicArg.key] = remainingArgs;
        } else {
            for (let arg of optionalArgs) {
                if (currentPos < posArgs.length) {
                    out[arg.key] = posArgs[currentPos++];
                } else {
                    out[arg.key] = undefined;
                }
            }
        }
        for (let arg of variadicArgs) {
            if (!(arg.key in out)) {
                out[arg.key] = [];
            }
        }
        for (let {key, hasArg} of this.optionsForParsing.values()) {
            if (!(key in out)) {
                if (hasArg) {
                    out[key] = undefined;
                } else {
                    out[key] = false;
                }
            }
        }
        return out as ParsedArguments<Args, Opts>;
    }

    getHelpMessage(): string {
        let argUsage = this.args.map(arg => arg.synopsis).join(' ').toUpperCase();
        let out = `Usage: ${this.name} ${this.options.length > 0 ? '[OPTION]... ' : ''}${argUsage}\n`;
        out += this.description + '\n';
        if (this.options.length > 0) {
            out += '\nOptions:\n';
            for (let option of this.options) {
                let optText = `  -${option.name}`;
                if (option.longName) {
                    optText += `, ${option.longName}`;
                }
                if (option.arg !== null) {
                    optText += `${option.argIsOptional ? '[=' : '='}${option.arg}${option.argIsOptional ? ']' : ''}`;
                }
                if (option.description) {
                    optText = optText.padEnd(28);
                    optText += option.description;
                }
                out += optText + '\n';
            }
            out += '  -h, --help              Display this help and exit\n';
        }
        return out;
    }

}

export function command(name: string, description: string): Command {
    return new Command(name, description);
}
