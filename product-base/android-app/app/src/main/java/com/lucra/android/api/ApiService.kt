package com.lucra.android.api

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Query

interface ApiService {
    @POST("login")
    suspend fun login(@Body req: LoginRequest): User

    @POST("signup")
    suspend fun signup(@Body req: SignupRequest): IdResponse

    @GET("rng")
    suspend fun generateNumber(@Header("rng-user-id") userId: Int): NumberResponse

    @GET("stats")
    suspend fun getStats(@Header("rng-user-id") userId: Int): StatsResponse

    @GET("numbers")
    suspend fun getNumbers(
        @Header("rng-user-id") userId: Int,
        @Query("page") page: Int,
        @Query("limit") limit: Int = 25
    ): NumbersResponse

    @POST("update-profile")
    suspend fun updateProfile(
        @Header("rng-user-id") userId: Int,
        @Body req: UpdateProfileRequest
    ): User
}

object ApiClient {
    private const val BASE_URL = "http://playrng.us-east-1.elasticbeanstalk.com/"

    val service: ApiService by lazy {
        retrofit2.Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(retrofit2.converter.gson.GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
