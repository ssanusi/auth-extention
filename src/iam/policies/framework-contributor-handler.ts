import { Injectable } from '@nestjs/common';
import { PolicyHandler } from './interfaces/policy-handler.interface';
import { FrameworkContributorPolicy } from './framework-contributor.policy';
import { IActiveUserData } from '../interface/active-user-data.interface';
import { PolicyHandlerStorage } from './policy-handlers.storage';

@Injectable()
export class FrameworkContributorPolicyHandler
  implements PolicyHandler<FrameworkContributorPolicy>
{
  constructor(private readonly policyHandlerStorage: PolicyHandlerStorage) {
    this.policyHandlerStorage.add(FrameworkContributorPolicy, this);
  }
  async handle(
    policy: FrameworkContributorPolicy,
    user: IActiveUserData,
  ): Promise<void> {
    const isContributor = await user.email.endsWith('@icloud.com');
    if (!isContributor) {
      throw new Error('User is not a contributor');
    }
  }
}
