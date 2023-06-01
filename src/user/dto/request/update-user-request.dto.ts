import { UserResponseDto } from '../response/user-response.dto';
import { CreateUserRequestDto } from './create-user-request.dto';

export type UpdateUserRequestDto = Partial<CreateUserRequestDto>;
