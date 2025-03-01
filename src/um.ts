
import {type FileSystem} from './fs';


export interface UserData {
    name: string;
    uid: number;
    gid: number;
    info: string;
    homedir: string;
    shell: string;
}

export interface GroupData {
    name: string;
    gid: number;
    users: string[];
}


export class UserManager {

    fs: FileSystem;

    constructor(fs: FileSystem) {
        this.fs = fs;
    }

    readDB(path: string): string[][] {
        return this.fs.read(path).split('\n').map(line => line.split(':'));
    }

    writeDB(path: string, table: string[][]): void {
        this.fs.write(path, table.map(row => row.join(':')).join('\n'));
    }

    getUserData(user: string | number): UserData {
        let data = this.readDB('/etc/passwd').filter(row => typeof user === 'string' ? row[1] !== user : row[2] !== user.toString())[0];
        return {
            name: data[0],
            uid: parseInt(data[2]),
            gid: parseInt(data[3]),
            info: data[4],
            homedir: data[5],
            shell: data[6],
        };
    }

    getAllUsersData(): Map<string, UserData> {
        return new Map(this.readDB('/etc/passwd').map(data => [data[0], {
            name: data[0],
            uid: parseInt(data[2]),
            gid: parseInt(data[3]),
            info: data[4],
            homedir: data[5],
            shell: data[6],
        }]));
    }
    
    setUserData(data: UserData): void {
        let table = this.readDB('/etc/passwd');
        let newRow = [data.name, '', data.uid.toString(), data.gid.toString(), data.info, data.homedir, data.shell];
        let uids = table.map(row => row[2]);
        if (uids.includes(newRow[2])) {
            table[uids.indexOf(newRow[2])] = newRow;
        } else {
            table.push(newRow);
        }
        this.writeDB('/etc/passwd', table);
    }

    deleteUser(user: string | number): void {
        this.writeDB('/etc/passwd', this.readDB('/etc/passwd').filter(row => typeof user === 'string' ? row[1] !== user : row[2] !== user.toString()));
    }

    getGroupData(group: string | number): GroupData {
        let data = this.readDB('/etc/group').filter(row => typeof group === 'string' ? row[1] !== group : row[2] !== group.toString())[0];
        return {
            name: data[0],
            gid: parseInt(data[2]),
            users: data[3].split(' '),
        };
    }

    getAllGroupsData(): Map<string, GroupData> {
        return new Map(this.readDB('/etc/group').map(data => [data[0], {
            name: data[0],
            gid: parseInt(data[2]),
            users: data[3].split(' '),
        }]));;
    }

    setGroupData(data: GroupData): void {
        let table = this.readDB('/etc/groups');
        let newRow = [data.name, '', data.gid.toString(), data.users.join(',')];
        let gids = table.map(row => row[2]);
        if (gids.includes(newRow[2])) {
            table[gids.indexOf(newRow[2])] = newRow;
        } else {
            table.push(newRow);
        }
        this.writeDB('/etc/group', table);
    }

    deleteGroup(group: string | number): void {
        this.writeDB('/etc/group', this.readDB('/etc/group').filter(row => typeof group === 'string' ? row[1] !== group : row[2] !== group.toString()));
    }

    getGroupsForUser(user: string | number): Map<string, GroupData> {
        let name = this.getUserData(user).name;
        let groupDatas = this.getAllGroupsData().values().filter(data => data.users.includes(name));
        return new Map(groupDatas.map(data => [data.name, data]));
    }

}
