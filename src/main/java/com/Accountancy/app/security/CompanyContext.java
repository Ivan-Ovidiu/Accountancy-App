package com.Accountancy.app.security;

import org.springframework.stereotype.Component;

/**
 * Holds the companyId of the currently-authenticated request, populated
 * by {@link JwtFilter} when a final token is presented.
 *
 * Use {@link #getCurrentCompanyId()} from any service to scope queries to
 * the active company. Returns null for unauthenticated or pre-auth requests.
 */
@Component
public class CompanyContext {

    private static final ThreadLocal<Integer> CURRENT = new ThreadLocal<>();

    public void setCurrentCompanyId(Integer companyId) {
        CURRENT.set(companyId);
    }

    public Integer getCurrentCompanyId() {
        return CURRENT.get();
    }

    public Integer requireCurrentCompanyId() {
        Integer id = CURRENT.get();
        if (id == null) {
            throw new IllegalStateException(
                    "No company selected on this request. Token must carry a companyId claim.");
        }
        return id;
    }

    public void clear() {
        CURRENT.remove();
    }
}