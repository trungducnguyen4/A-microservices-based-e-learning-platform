package org.tduc.userservice.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.tduc.userservice.dto.request.UserCreationRequest;
import org.tduc.userservice.dto.request.UserEditRequest;
import org.tduc.userservice.dto.response.UserResponse;
import org.tduc.userservice.model.User;
@Mapper(componentModel = "spring")
public interface UserMapper {

        User toUser(UserCreationRequest request);
        void updateUser (@MappingTarget User user, UserEditRequest request);
        UserResponse toUserResponse(User user);
}
