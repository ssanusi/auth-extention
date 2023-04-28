import { Role } from 'src/users/enums/role.enum';
import { PermissionType } from '../authorization/permission.type';

export interface IActiveUserData {
  sub: number;
  email: string;
  refreshTokenId: string;
  role: Role;
  permissions: PermissionType[];
}
