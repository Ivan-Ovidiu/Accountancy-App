package com.Accountancy.app.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public class ClientDTO {

    public record ClientRequest(
            @NotBlank(message = "Name is required")
            @Size(max = 100, message = "Name must not exceed 100 characters")
            String name,

            @Email(message = "Invalid email format")
            @Size(max = 100)
            String email,

            @Size(max = 20, message = "Phone must not exceed 20 characters")
            String phone,

            @Size(max = 255, message = "Address must not exceed 255 characters")
            String address,

            @Size(max = 50, message = "Tax ID must not exceed 50 characters")
            String taxId
    ) {}

    public record ClientResponse(
            Integer id, String name, String email, String phone,
            String address, String taxId, Boolean isActive, LocalDateTime createdAt
    ) {}
}