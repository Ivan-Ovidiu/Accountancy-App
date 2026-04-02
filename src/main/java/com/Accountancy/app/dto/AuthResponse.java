package com.Accountancy.app.dto;

public record AuthResponse(String token, String email, String name, String role) {}