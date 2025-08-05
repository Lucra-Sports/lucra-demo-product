package com.lucra.android.ui.screens

import android.util.Log
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
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
    Column(
        modifier = Modifier
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.Top
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
                },
            singleLine = true,
            label = { Text("Email") }
        )
        Spacer(modifier = Modifier.height(8.dp))
        TextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation()
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = {
            scope.launch {
                try {
                    val user = ApiClient.service.login(LoginRequest(email, password))
                    UserManager.currentUser.value = user
                    navController.navigate("dashboard") {
                        popUpTo("login") { inclusive = true }
                    }
                } catch (e: Exception) {
                    Log.e("LoginScreen", "Login failed", e)
                }
            }
        }) { Text("Login") }
        TextButton(onClick = { navController.navigate("signup") }) { Text("Sign Up") }
    }
}
