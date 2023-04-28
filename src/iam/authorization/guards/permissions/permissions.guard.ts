import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { REQUEST_USER_KEY } from 'src/iam/iam.constant';
import { PERMISSIONS_KEY } from '../../decorators/permissions.decorator';
import { PermissionType } from '../../permission.type';
import { IActiveUserData } from 'src/iam/interface/active-user-data.interface';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const contextRoles = this.reflector.getAllAndOverride<PermissionType[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!contextRoles) {
      return true;
    }
    const user: IActiveUserData = context.switchToHttp().getRequest()[
      REQUEST_USER_KEY
    ];
    return contextRoles.every((permission) =>
      user.permissions?.includes(permission),
    );
  }
}
