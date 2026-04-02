package com.Accountancy.app.dto;

import com.Accountancy.app.entities.User.Role;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public class UserDTO {

    public record UserRequest(
            @NotBlank(message = "Name is required")
            String name,

            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email format")
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 6, message = "Password must be at least 6 characters")
            String password,

            Role role
    ) {}

    public record UpdateUserRequest(
            @NotBlank(message = "Name is required")
            String name,

            @NotBlank(message = "Email is required")
            @Email(message = "Invalid email format")
            String email,

            Role role
    ) {}

    public record ChangePasswordRequest(
            @NotBlank(message = "Current password is required")
            String currentPassword,

            @NotBlank(message = "New password is required")
            @Size(min = 6, message = "New password must be at least 6 characters")
            String newPassword
    ) {}

    public record UserResponse(
            Integer id, String name, String email,
            Role role, Boolean isActive, LocalDateTime createdAt
    ) {}
}