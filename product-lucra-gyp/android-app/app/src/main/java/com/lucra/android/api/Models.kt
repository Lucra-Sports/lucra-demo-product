package com.lucra.android.api

data class User(
    val id: Int,
    val full_name: String,
    val email: String,
    val address: String?,
    val city: String?,
    val state: String?,
    val zip_code: String?,
    val birthday: String?
)

data class LoginRequest(val email: String, val password: String)

data class SignupRequest(
    val full_name: String,
    val email: String,
    val password: String,
    val address: String? = null,
    val city: String? = null,
    val state: String? = null,
    val zip_code: String? = null,
    val birthday: String? = null
)

data class IdResponse(val id: Int)

data class NumberResponse(val number: Int, val created_at: String)

data class StatsResponse(val totalNumbersGenerated: Int, val bestNumber: Int)

data class NumberItem(val id: Int, val value: Int, val created_at: String)

data class NumbersResponse(
    val numbers: List<NumberItem>,
    val page: Int,
    val totalPages: Int,
    val next: String?
)

data class UpdateProfileRequest(
    val full_name: String,
    val email: String,
    val address: String?,
    val city: String?,
    val state: String?,
    val zip_code: String?,
    val birthday: String?
)
