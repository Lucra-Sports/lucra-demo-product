package com.lucra.android.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Divider
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.lucra.android.UserManager
import com.lucra.android.api.ApiClient
import com.lucra.android.api.NumberItem
import kotlinx.coroutines.launch

@Composable
fun HistoryScreen(navController: NavController) {
    val user = UserManager.currentUser.value
    var items by remember { mutableStateOf<List<NumberItem>>(emptyList()) }
    val scope = rememberCoroutineScope()

    if (user == null) {
        LaunchedEffect(Unit) { navController.navigate("login") }
        return
    }

    LaunchedEffect(Unit) {
        scope.launch {
            try {
                val response = ApiClient.service.getNumbers(user.id, page = 1)
                items = response.numbers
            } catch (e: Exception) {
            }
        }
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        TextButton(onClick = { navController.popBackStack() }) { Text("Back") }
        Spacer(modifier = Modifier.height(16.dp))
        LazyColumn {
            items(items) { item ->
                Text("${item.value} - ${item.created_at}")
                Divider()
            }
        }
    }
}
