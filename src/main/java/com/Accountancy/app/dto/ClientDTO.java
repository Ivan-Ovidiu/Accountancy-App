package com.Accountancy.app.dto;

import java.time.LocalDateTime;

public class ClientDTO {

    // Used for CREATE and UPDATE requests from frontend
    public record ClientRequest(
            String name,
            String email,
            String phone,
            String address,
            String taxId
    ) {}

    // Used for responses to frontend
    public record ClientResponse(
            Integer id,
            String name,
            String email,
            String phone,
            String address,
            String taxId,
            Boolean isActive,
            LocalDateTime createdAt
    ) {}
}