#!/bin/bash

# Run the database fix script
echo "Running database relationship fix..."

# You can run this script with your Supabase CLI or copy the SQL to your Supabase dashboard
echo "Please run the following SQL in your Supabase SQL editor:"
echo ""
cat scripts/003_fix_polls_profiles_relationship.sql
echo ""
echo "Or run: supabase db reset (if you want to reset and recreate all tables)"
