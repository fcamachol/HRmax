# HRMax Setup Instructions

## 🚀 Quick Start

### Step 1: Database Setup

You need a PostgreSQL database. Choose one option:

#### Option A: Use Replit Database (If running on Replit)

1. Open your Replit project
2. Go to **Tools** → **Database**
3. Click **Get Connection String**
4. Copy the connection string
5. Update `.env` file with the connection string

#### Option B: Create Free Neon Database (Recommended for local development)

1. Go to [neon.tech](https://neon.tech)
2. Sign up for free (GitHub account works)
3. Create a new project
4. Copy the connection string (looks like: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb`)
5. Update `.env` file:
   ```env
   DATABASE_URL=your-connection-string-here
   ```

#### Option C: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database: `createdb hrmax`
3. Update `.env` file:
   ```env
   DATABASE_URL=postgresql://localhost:5432/hrmax
   ```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Push Database Schema

```bash
npm run db:push
```

This will create all the necessary tables in your database.

### Step 4: Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Step 5: Access Payroll Test Environment

Open your browser and navigate to:

```
http://localhost:5000/payroll-test
```

**No login required!** You can immediately start testing payroll calculations.

## 🧪 Testing the Payroll Engine

Once the server is running:

1. **Navigate to**: `http://localhost:5000/payroll-test`
2. **Try Quick Presets**:
   - Click "Básico" for a standard calculation
   - Click "Con Horas Extra" to test overtime
   - Click "Con Faltas" to test absences
3. **Or Create Custom Scenarios**:
   - Modify salary fields
   - Add incidents
   - Click "Calcular Nómina"

## 📝 What to Expect

**Basic Calculation Example**:
- Input: $600/day salary, 11 days worked
- Output: ~$5,800 net pay (after ISR and IMSS)

**With Overtime Example**:
- Input: $600/day salary, 11 days + 5 hours overtime
- Output: ~$6,350 net pay

## 🔧 Troubleshooting

### Error: "DATABASE_URL must be set"

**Solution**: Update `.env` file with your database connection string (see Step 1 above)

### Error: "Connection refused" or "Cannot connect to database"

**Solutions**:
1. Verify your database is running
2. Check the connection string is correct
3. Ensure your IP is whitelisted (for Neon/cloud databases)
4. Try `npm run db:push` to initialize the schema

### Port 5000 already in use

**Solution**: The server uses port 5000 by default. If another app is using it, you can change it or stop the other app.

### Cannot access /payroll-test

**Solution**: Make sure the dev server is running (`npm run dev`) and navigate to the full URL: `http://localhost:5000/payroll-test`

## 📚 Additional Resources

- **Payroll Engine Documentation**: See `PAYROLL_ENGINE_README.md`
- **Test Environment Guide**: See `PAYROLL_TEST_ENVIRONMENT.md`
- **Architecture Details**: See `PAYROLL_ENGINE_ARCHITECTURE.md`
- **Usage Examples**: See `PAYROLL_ENGINE_USAGE.md`
- **2026 Fiscal Changes**: See `CAMBIOS_2026.md`

## 🎯 Next Steps

After successfully starting the dev server:

1. ✅ Test the payroll calculator at `/payroll-test`
2. ✅ Try different salary scenarios
3. ✅ Verify 2026 fiscal compliance
4. ✅ Review the audit trail
5. ✅ Compare calculations with NOI or manual calculations

## 💡 Tips

- **No Auth Required**: The `/payroll-test` page doesn't need login
- **Real Calculations**: Uses the same engine as production
- **Safe Testing**: No data is saved to the database
- **Full Audit Trail**: See every step of the calculation

---

**Need Help?** Check the troubleshooting section above or review the documentation files.
