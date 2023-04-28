import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { Role } from 'src/users/enums/role.enum';
import { ROLES_KEY } from '../../decorators/roles.decorator';
import { REQUEST_USER_KEY } from 'src/iam/iam.constant';
import { IActiveUserData } from 'src/iam/interface/active-user-data.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const contextRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!contextRoles) {
      return true;
    }
    const user: IActiveUserData = context.switchToHttp().getRequest()[
      REQUEST_USER_KEY
    ];
    return contextRoles.some((role) => user.role.includes(role));
  }
}
