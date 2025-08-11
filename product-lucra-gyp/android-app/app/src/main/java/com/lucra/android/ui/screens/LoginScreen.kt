package com.lucra.android.ui.screens

import android.util.Log
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.autofill.AutofillNode
import androidx.compose.ui.autofill.AutofillType
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalAutofill
import androidx.compose.ui.platform.LocalAutofillTree
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.material3.ButtonDefaults
import com.lucra.android.ui.theme.PrimaryColor
import com.lucra.android.ui.theme.SecondaryColor
import androidx.compose.ui.Alignment
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.lucra.android.UserManager
import com.lucra.android.api.ApiClient
import com.lucra.android.api.LoginRequest
import kotlinx.coroutines.launch

@OptIn(ExperimentalComposeUiApi::class)
@Composable
fun LoginScreen(navController: NavController) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    val focusRequester = remember { FocusRequester() }
    val autofill = LocalAutofill.current
    val autofillNode = remember {
        AutofillNode(
            autofillTypes = listOf(AutofillType.EmailAddress),
            onFill = { email = it }
        )
    }
    LocalAutofillTree.current += autofillNode
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(PrimaryColor, SecondaryColor)
                )
            )
            .padding(16.dp)
    ) {
        Column(
            modifier = Modifier
                .align(Alignment.Center)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            TextField(
                value = email,
                onValueChange = {
                    email = it
                },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                modifier = Modifier
                    .focusRequester(focusRequester)
                    .onGloballyPositioned {
                        autofillNode.boundingBox = it.boundsInWindow()
                    }
                    .onFocusChanged { focusState ->
                        if (focusState.isFocused) {
                            autofill?.requestAutofillForNode(autofillNode)
                        } else {
                            autofill?.cancelAutofillForNode(autofillNode)
                        }
                    }
                    .fillMaxWidth(),
                singleLine = true,
                label = { Text("Email") },
                shape = RoundedCornerShape(50)
            )
            Spacer(modifier = Modifier.height(8.dp))
            TextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Password") },
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(50)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = {
                scope.launch {
                    try {
                    val user = ApiClient.service.login(LoginRequest(email, password))
                    UserManager.setUser(user)
                    navController.navigate("dashboard") {
                        popUpTo("login") { inclusive = true }
                    }
                } catch (e: Exception) {
                    Log.e("LoginScreen", "Login failed", e)
                }
            }
            },
            colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent, contentColor = Color.White),
            modifier = Modifier
                .background(
                    brush = Brush.horizontalGradient(listOf(PrimaryColor, SecondaryColor)),
                    shape = RoundedCornerShape(50)
                )
                .fillMaxWidth()
            ) { Text("Login", fontSize = 18.sp) }
            TextButton(onClick = { navController.navigate("signup") }) { Text("Sign Up", fontSize = 16.sp) }
        }
    }
}
