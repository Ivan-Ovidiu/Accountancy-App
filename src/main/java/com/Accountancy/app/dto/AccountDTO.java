package com.Accountancy.app.dto;

import com.Accountancy.app.entities.Account.AccountType;

public class AccountDTO {

    // Used for CREATE and UPDATE
    public record AccountRequest(
            String code,
            String name,
            AccountType type,
            String subType,
            Integer parentId
    ) {}

    // Used for responses — includes parent info
    public record AccountResponse(
            Integer id,
            String code,
            String name,
            AccountType type,
            String subType,
            Integer parentId,
            String parentName,
            Boolean isActive
    ) {}
}