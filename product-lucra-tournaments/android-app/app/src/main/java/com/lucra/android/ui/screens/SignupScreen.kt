package com.lucra.android.ui.screens

import android.util.Log
import android.util.Log.e
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.material3.ButtonDefaults
import com.lucra.android.ui.theme.PrimaryColor
import com.lucra.android.ui.theme.SecondaryColor
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
                    listOf(PrimaryColor, SecondaryColor)
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
            Button(
                onClick = {
                scope.launch {
                    try {
                        ApiClient.service.signup(
                            SignupRequest(
                                fullName = fullName,
                                email = email,
                                password = password,
                                address = address.takeIf { it.isNotBlank() },
                                city = city.takeIf { it.isNotBlank() },
                                state = state.takeIf { it.isNotBlank() },
                                zipCode = zip.takeIf { it.isNotBlank() },
                                birthday = birthday.takeIf { it.isNotBlank() }
                            )
                        )
                        navController.popBackStack()
                    } catch (e: Exception) {
                    }
                }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent, contentColor = Color.White),
                modifier = Modifier
                    .background(
                        Brush.horizontalGradient(listOf(PrimaryColor, SecondaryColor)),
                        shape = RoundedCornerShape(50)
                    )
                    .fillMaxWidth()
            ) { Text("Create Account") }
        }
    }
}
