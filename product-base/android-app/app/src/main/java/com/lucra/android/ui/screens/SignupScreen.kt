package com.lucra.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.lucra.android.api.ApiClient
import com.lucra.android.api.SignupRequest
import kotlinx.coroutines.launch

@Composable
fun SignupScreen(navController: NavController) {
    var fullName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var city by remember { mutableStateOf("") }
    var state by remember { mutableStateOf("") }
    var zip by remember { mutableStateOf("") }
    var birthday by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        Color(0xFF8B5CF6),
                        Color(0xFFEC4899),
                        Color(0xFFF43F5E)
                    )
                )
            )
            .padding(16.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.Center
        ) {
            TextField(value = fullName, onValueChange = { fullName = it }, label = { Text("Full Name") })
            Spacer(modifier = Modifier.height(8.dp))
            TextField(value = email, onValueChange = { email = it }, label = { Text("Email") })
            Spacer(modifier = Modifier.height(8.dp))
            TextField(value = address, onValueChange = { address = it }, label = { Text("Address") })
            Spacer(modifier = Modifier.height(8.dp))
            TextField(value = city, onValueChange = { city = it }, label = { Text("City") })
            Spacer(modifier = Modifier.height(8.dp))
            TextField(value = state, onValueChange = { state = it }, label = { Text("State") })
            Spacer(modifier = Modifier.height(8.dp))
            TextField(value = zip, onValueChange = { zip = it }, label = { Text("Zip Code") })
            Spacer(modifier = Modifier.height(8.dp))
            TextField(value = birthday, onValueChange = { birthday = it }, label = { Text("Birthday") })
            Spacer(modifier = Modifier.height(8.dp))
            TextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Password") },
                visualTransformation = PasswordVisualTransformation(),
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = {
                scope.launch {
                    try {
                        ApiClient.service.signup(
                            SignupRequest(
                                full_name = fullName,
                                email = email,
                                password = password,
                                address = address.takeIf { it.isNotBlank() },
                                city = city.takeIf { it.isNotBlank() },
                                state = state.takeIf { it.isNotBlank() },
                                zip_code = zip.takeIf { it.isNotBlank() },
                                birthday = birthday.takeIf { it.isNotBlank() }
                            )
                        )
                        navController.popBackStack()
                    } catch (e: Exception) {
                    }
                }
            }) { Text("Create Account") }
        }
    }
}
