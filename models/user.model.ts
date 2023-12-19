import {
  DocumentType,
  Severity,
  getModelForClass,
  modelOptions,
  pre,
  prop,
} from '@typegoose/typegoose';
import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';

export const privateFields = [
  'password',
  '__v',
  'verificationCode',
  'passwordResetCode',
  'verified',
];

@pre<User>('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const hash = await argon2.hash(this.password);
  this.password = hash;
  return;
})
@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class User {
  @prop({ type: () => String, lowercase: true, required: true, unique: true })
  email: string;

  @prop({ type: () => String, required: true })
  username: string;

  @prop({ type: () => String, required: true, select: false })
  password: string;

  @prop({
    type: () => String,
    required: true,
    default: () => uuidv4(),
    select: false,
  })
  verificationCode: string | null;

  @prop({ type: () => String, select: false })
  passwordReset: string;

  @prop({ type: () => String, default: false })
  verified: boolean;

  async validatePassword(this: DocumentType<User>, candidatePassword: string) {
    try {
      const user = await UserModel.findById(this._id)
        .select('+password')
        .exec();

      if (!user) {
        console.log('User not found');
        return false;
      }
      return argon2.verify(user.password, candidatePassword);
    } catch (error) {
      console.log(`Could not validate password`);
      return false;
    }
  }
}

const UserModel = getModelForClass(User);

export default UserModel;
