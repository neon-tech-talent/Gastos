/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface KotlinFile {
  name: string;
  path: string;
  language: string;
  content: string;
}

export const KOTLIN_PROJECT_FILES: KotlinFile[] = [
  {
    name: "Entities & Database",
    path: "com/ejemplo/gastos/data/ExpenseDatabase.kt",
    language: "kotlin",
    content: `package com.ejemplo.gastos.data

import android.content.Context
import androidx.room.*
import kotlinx.coroutines.flow.Flow

// 1. Gasto Fijo Entity
@Entity(tableName = "gastos_fijos")
data class FixedExpenseEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val amount: Double,
    val startDate: String, // Formato "YYYY-MM"
    val endDate: String? = null,
    val isActive: Boolean = true,
    val category: String,
    val notes: String? = null
)

// 2. Gasto Diario Entity
@Entity(tableName = "gastos_diarios")
data class DailyExpenseEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val amount: Double,
    val date: String, // Formato "YYYY-MM-DD"
    val category: String,
    val paymentMethod: String, // "Efectivo", "Débito", "Transferencia", "Otro"
    val description: String? = null
)

// 3. Gasto de Tarjeta de Crédito Entity
@Entity(tableName = "gastos_tarjeta")
data class CardPurchaseEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val totalAmount: Double,
    val purchaseDate: String, // Formato "YYYY-MM-DD" o "YYYY-MM"
    val installmentsCount: Int, // Cantidad de cuotas (ej. 3)
    val cardName: String, // "Visa", "Mastercard", "Amex", "Otra"
    val description: String? = null
)

// DAOs (Data Access Objects)
@Dao
interface ExpenseDao {
    // Gastos Fijos
    @Query("SELECT * FROM gastos_fijos")
    fun getAllFixedExpenses(): Flow<List<FixedExpenseEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFixedExpense(expense: FixedExpenseEntity)

    @Update
    suspend fun updateFixedExpense(expense: FixedExpenseEntity)

    @Delete
    suspend fun deleteFixedExpense(expense: FixedExpenseEntity)

    // Gastos Diarios
    @Query("SELECT * FROM gastos_diarios ORDER BY date DESC")
    fun getAllDailyExpenses(): Flow<List<DailyExpenseEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDailyExpense(expense: DailyExpenseEntity)

    @Update
    suspend fun updateDailyExpense(expense: DailyExpenseEntity)

    @Delete
    suspend fun deleteDailyExpense(expense: DailyExpenseEntity)

    // Gastos Tarjeta
    @Query("SELECT * FROM gastos_tarjeta ORDER BY purchaseDate DESC")
    fun getAllCardPurchases(): Flow<List<CardPurchaseEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCardPurchase(purchase: CardPurchaseEntity)

    @Update
    suspend fun updateCardPurchase(purchase: CardPurchaseEntity)

    @Delete
    suspend fun deleteCardPurchase(purchase: CardPurchaseEntity)
}

// Room Database Setup
@Database(
    entities = [FixedExpenseEntity::class, DailyExpenseEntity::class, CardPurchaseEntity::class],
    version = 1,
    exportSchema = false
)
abstract class ExpenseDatabase : RoomDatabase() {
    abstract fun expenseDao(): ExpenseDao

    companion object {
        @Volatile
        private var INSTANCE: ExpenseDatabase? = null

        fun getDatabase(context: Context): ExpenseDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    ExpenseDatabase::class.java,
                    "control_gastos_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}`
  },
  {
    name: "Dashboard ViewModel",
    path: "com/ejemplo/gastos/ui/viewmodel/ExpenseViewModel.kt",
    language: "kotlin",
    content: `package com.ejemplo.gastos.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ejemplo.gastos.data.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class ExpenseViewModel(private val dao: ExpenseDao) : ViewModel() {

    // Cambiar de mes seleccionado para cálculos de cuotas y resúmenes
    private val _selectedMonth = MutableStateFlow(SimpleDateFormat("yyyy-MM", Locale.getDefault()).format(Date()))
    val selectedMonth: StateFlow<String> = _selectedMonth.asStateFlow()

    val fixedExpenses: StateFlow<List<FixedExpenseEntity>> = dao.getAllFixedExpenses()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val dailyExpenses: StateFlow<List<DailyExpenseEntity>> = dao.getAllDailyExpenses()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val cardPurchases: StateFlow<List<CardPurchaseEntity>> = dao.getAllCardPurchases()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun setSelectedMonth(ym: String) {
        _selectedMonth.value = ym
    }

    // --- OPERACIONES: Gastos Fijos ---
    fun addFixedExpense(name: String, amount: Double, startDate: String, category: String, notes: String?) {
        viewModelScope.launch {
            dao.insertFixedExpense(FixedExpenseEntity(name = name, amount = amount, startDate = startDate, category = category, notes = notes))
        }
    }

    fun updateFixedExpense(expense: FixedExpenseEntity) {
        viewModelScope.launch {
            dao.updateFixedExpense(expense)
        }
    }

    fun toggleFixedExpenseActive(expense: FixedExpenseEntity) {
        viewModelScope.launch {
            dao.updateFixedExpense(expense.copy(isActive = !expense.isActive))
        }
    }

    fun deleteFixedExpense(expense: FixedExpenseEntity) {
        viewModelScope.launch {
            dao.deleteFixedExpense(expense)
        }
    }

    // --- OPERACIONES: Gastos Diarios ---
    fun addDailyExpense(name: String, amount: Double, date: String, category: String, paymentMethod: String, description: String?) {
        viewModelScope.launch {
            dao.insertDailyExpense(DailyExpenseEntity(name = name, amount = amount, date = date, category = category, paymentMethod = paymentMethod, description = description))
        }
    }

    fun deleteDailyExpense(expense: DailyExpenseEntity) {
        viewModelScope.launch {
            dao.deleteDailyExpense(expense)
        }
    }

    // --- OPERACIONES: Tarjetas de Crédito ---
    fun addCardPurchase(name: String, totalAmount: Double, purchaseDate: String, installmentsCount: Int, cardName: String, description: String?) {
        viewModelScope.launch {
            dao.insertCardPurchase(CardPurchaseEntity(
                name = name,
                totalAmount = totalAmount,
                purchaseDate = purchaseDate,
                installmentsCount = installmentsCount,
                cardName = cardName,
                description = description
            ))
        }
    }

    fun cancelCardPurchase(purchase: CardPurchaseEntity) {
        viewModelScope.launch {
            dao.deleteCardPurchase(purchase)
        }
    }

    // --- LÓGICA DE INSTALMENTS / CUOTAS ---
    // Función auxiliar para determinar si un mes seleccionado está impactado por las cuotas
    fun isMonthImpactedByCardPurchase(purchaseDateYm: String, installments: Int, targetYm: String): Boolean {
        try {
            val sdf = SimpleDateFormat("yyyy-MM", Locale.getDefault())
            val datePurchase = sdf.parse(purchaseDateYm) ?: return false
            val dateTarget = sdf.parse(targetYm) ?: return false
            
            val cal = Calendar.getInstance()
            cal.time = datePurchase
            
            // Las cuotas impactan en meses futuros (M+1 hasta M+N) según especificación
            val impactMonths = mutableListOf<String>()
            for (i in 1..installments) {
                cal.add(Calendar.MONTH, 1)
                impactMonths.add(sdf.format(cal.time))
            }
            return targetYm in impactMonths
        } catch (e: Exception) {
            return false
        }
    }

    // Calcular cuota actual de una compra dada en un mes específico
    fun getInstallmentNumberForMonth(purchaseDateYm: String, installmentsCount: Int, targetYm: String): Int? {
        try {
            val sdf = SimpleDateFormat("yyyy-MM", Locale.getDefault())
            val datePurchase = sdf.parse(purchaseDateYm) ?: return null
            val dateTarget = sdf.parse(targetYm) ?: return null
            
            val cal = Calendar.getInstance()
            cal.time = datePurchase
            
            for (i in 1..installmentsCount) {
                cal.add(Calendar.MONTH, 1)
                if (sdf.format(cal.time) == targetYm) {
                    return i
                }
            }
            return null
        } catch (e: Exception) {
            return null
        }
    }
}`
  },
  {
    name: "Material 3 Main Screen",
    path: "com/ejemplo/gastos/MainActivity.kt",
    language: "kotlin",
    content: `package com.ejemplo.gastos

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.navigation.compose.*
import com.ejemplo.gastos.data.ExpenseDatabase
import com.ejemplo.gastos.ui.theme.ControlGastosTheme
import com.ejemplo.gastos.ui.viewmodel.ExpenseViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val db = ExpenseDatabase.getDatabase(this)
        val viewModel = ExpenseViewModel(db.expenseDao())

        setContent {
            ControlGastosTheme {
                val navController = rememberNavController()
                
                Scaffold(
                    bottomBar = {
                        NavigationBar {
                            val navBackStackEntry by navController.currentBackStackEntryAsState()
                            val currentRoute = navBackStackEntry?.destination?.route
                            
                            NavigationBarItem(
                                icon = { Icon(Icons.Default.Home, contentDescription = "Inicio") },
                                label = { Text("Inicio") },
                                selected = currentRoute == "dashboard",
                                onClick = { navController.navigate("dashboard") }
                            )
                            NavigationBarItem(
                                icon = { Icon(Icons.Default.DateRange, contentDescription = "Fijos") },
                                label = { Text("Fijos") },
                                selected = currentRoute == "fixed",
                                onClick = { navController.navigate("fixed") }
                            )
                            NavigationBarItem(
                                icon = { Icon(Icons.Default.List, contentDescription = "Diarios") },
                                label = { Text("Diarios") },
                                selected = currentRoute == "daily",
                                onClick = { navController.navigate("daily") }
                            )
                            NavigationBarItem(
                                icon = { Icon(Icons.Default.CreditCard, contentDescription = "Tarjetas") },
                                label = { Text("Tarjetas") },
                                selected = currentRoute == "cards",
                                onClick = { navController.navigate("cards") }
                            )
                        }
                    }
                ) { innerPadding ->
                    NavHost(
                        navController = navController,
                        startDestination = "dashboard",
                        modifier = Modifier.padding(innerPadding)
                    ) {
                        composable("dashboard") { DashboardScreen(viewModel) }
                        composable("fixed") { FixedExpensesScreen(viewModel) }
                        composable("daily") { DailyExpensesScreen(viewModel) }
                        composable("cards") { CreditCardsScreen(viewModel) }
                    }
                }
            }
        }
    }
}`
  },
  {
    name: "Jetpack Compose Screen Examples",
    path: "com/ejemplo/gastos/ui/screens/DashboardScreen.kt",
    language: "kotlin",
    content: `package com.ejemplo.gastos.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.ejemplo.gastos.ui.viewmodel.ExpenseViewModel

@Composable
fun DashboardScreen(viewModel: ExpenseViewModel) {
    val selectedMonth by viewModel.selectedMonth.collectAsState()
    val fijos by viewModel.fixedExpenses.collectAsState()
    val diarios by viewModel.dailyExpenses.collectAsState()
    val tarjetas by viewModel.cardPurchases.collectAsState()

    // Realizar agregaciones para calcular los totales del mes seleccionado
    val totalFijos = remember(fijos, selectedMonth) {
        fijos.filter { it.isActive && it.startDate <= selectedMonth && (it.endDate == null || it.endDate >= selectedMonth) }
            .sumOf { it.amount }
    }

    val totalDiarios = remember(diarios, selectedMonth) {
        diarios.filter { it.date.startsWith(selectedMonth) }
            .sumOf { it.amount }
    }

    val totalTarjetas = remember(tarjetas, selectedMonth) {
        tarjetas.filter { viewModel.isMonthImpactedByCardPurchase(it.purchaseDate.substring(0, 7), it.installmentsCount, selectedMonth) }
            .sumOf { it.totalAmount / it.installmentsCount }
    }

    val totalGeneral = totalFijos + totalDiarios + totalTarjetas

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Total Gastado del Mes ($selectedMonth)", style = MaterialTheme.typography.titleMedium)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("$ $totalGeneral ARS", style = MaterialTheme.typography.headlineLarge)
                }
            }
        }

        item {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                // Tarjeta Gasto Fijo
                Card(modifier = Modifier.weight(1f)) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("Fijos", style = MaterialTheme.typography.bodyMedium)
                        Text("$ $totalFijos", style = MaterialTheme.typography.titleMedium)
                    }
                }
                // Tarjeta Gasto Diario
                Card(modifier = Modifier.weight(1f)) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("Diarios", style = MaterialTheme.typography.bodyMedium)
                        Text("$ $totalDiarios", style = MaterialTheme.typography.titleMedium)
                    }
                }
                // Tarjeta Tarjetas de Crédito
                Card(modifier = Modifier.weight(1f)) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("Cuotas Tarjetas", style = MaterialTheme.typography.bodyMedium)
                        Text("$ $totalTarjetas", style = MaterialTheme.typography.titleMedium)
                    }
                }
            }
        }
    }
}`
  }
];
