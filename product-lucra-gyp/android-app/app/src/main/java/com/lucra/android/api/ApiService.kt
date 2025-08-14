package com.lucra.android.api

import android.os.Handler
import android.os.Looper
import android.util.Log
import com.lucra.android.UserManager
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Query

interface ApiService {
    @POST("login")
    suspend fun login(@Body req: LoginRequest): User

    @POST("signup")
    suspend fun signup(@Body req: SignupRequest): IdResponse

    @PUT("bindings")
    suspend fun bindUser(@Header("rng-user-id") userId: Int, @Body req: UserBindingRequest): UserBindingResponse

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
    private const val BASE_URL = "http://playrng-lucra-gyp.us-east-1.elasticbeanstalk.com/"

    private val loggingInterceptor = HttpLoggingInterceptor { message ->
        Log.d("ApiClient", message)
    }.apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val authInterceptor = Interceptor { chain ->
        val response = chain.proceed(chain.request())
        if (response.code == 401 || response.code == 404) {
            Handler(Looper.getMainLooper()).post { UserManager.clearUser() }
        }
        response
    }

    private val client = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .addInterceptor(authInterceptor)
        .build()

    val service: ApiService by lazy {
        retrofit2.Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(retrofit2.converter.gson.GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
