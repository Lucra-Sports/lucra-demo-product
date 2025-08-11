package com.lucra.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Divider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import com.lucra.android.ui.theme.PrimaryColor
import com.lucra.android.ui.theme.SecondaryColor
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

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(PrimaryColor, SecondaryColor)
                )
            )
            .statusBarsPadding()
            .padding(end = 16.dp, start = 16.dp, bottom = 16.dp)
    ) {
        IconButton(
            onClick = { navController.popBackStack() },
            modifier = Modifier
                .padding(top = 16.dp)
                .size(48.dp)
        ) {
            Icon(
                Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = "Back",
                tint = Color.White
            )
        }
        Spacer(modifier = Modifier.height(16.dp))
        LazyColumn {
            items(items) { item ->
                Text("${item.value} - ${item.created_at}")
                Divider()
            }
        }
    }
}
