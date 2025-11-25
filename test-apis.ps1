# Test script for all APIs
# Run this in PowerShell after updating .env.local with correct Supabase keys

Write-Host "Testing all APIs on http://localhost:3000..."

# Create test users
Write-Host "Creating test users..."
Invoke-WebRequest -Uri "http://localhost:3000/api/user/init" -Method POST -ContentType "application/json" -Body '{"fid": 123, "username": "alice", "pfp_url": "https://example.com/alice.png"}'
Invoke-WebRequest -Uri "http://localhost:3000/api/user/init" -Method POST -ContentType "application/json" -Body '{"fid": 456, "username": "bob", "pfp_url": "https://example.com/bob.png"}'

# Get user profiles
Write-Host "Getting user profiles..."
Invoke-WebRequest -Uri "http://localhost:3000/api/user/profile?fid=123"
Invoke-WebRequest -Uri "http://localhost:3000/api/user/profile?fid=456"

# Get house info
Write-Host "Getting house info..."
Invoke-WebRequest -Uri "http://localhost:3000/api/house/info?fid=123"
Invoke-WebRequest -Uri "http://localhost:3000/api/house/info?fid=456"

# Start mining
Write-Host "Starting mining..."
Invoke-WebRequest -Uri "http://localhost:3000/api/house/mining" -Method POST -ContentType "application/json" -Body '{"fid": 123}'

# Upgrade house
Write-Host "Upgrading house..."
Invoke-WebRequest -Uri "http://localhost:3000/api/house/upgrade" -Method POST -ContentType "application/json" -Body '{"fid": 123}'

# Claim rewards
Write-Host "Claiming rewards..."
Invoke-WebRequest -Uri "http://localhost:3000/api/house/claim" -Method POST -ContentType "application/json" -Body '{"fid": 123}'

# Vote
Write-Host "Voting..."
Invoke-WebRequest -Uri "http://localhost:3000/api/house/vote" -Method POST -ContentType "application/json" -Body '{"voter_fid": 123, "host_fid": 456}'

# Explore houses
Write-Host "Exploring houses..."
Invoke-WebRequest -Uri "http://localhost:3000/api/houses/explore"

# Leaderboards
Write-Host "Getting leaderboards..."
Invoke-WebRequest -Uri "http://localhost:3000/api/leaderboard/weekly"
Invoke-WebRequest -Uri "http://localhost:3000/api/leaderboard/alltime"
Invoke-WebRequest -Uri "http://localhost:3000/api/leaderboard/top-rizz"

# Stay functionality
Write-Host "Starting stay..."
Invoke-WebRequest -Uri "http://localhost:3000/api/stay/start" -Method POST -ContentType "application/json" -Body '{"guest_fid": 123, "host_fid": 456}'

Write-Host "Getting current stay..."
Invoke-WebRequest -Uri "http://localhost:3000/api/stay/current?fid=123"

Write-Host "Getting guests..."
Invoke-WebRequest -Uri "http://localhost:3000/api/stay/guests?host_fid=456"

Write-Host "Getting my guests..."
Invoke-WebRequest -Uri "http://localhost:3000/api/stay/my-guests?host_fid=456"

Write-Host "Stopping stay..."
Invoke-WebRequest -Uri "http://localhost:3000/api/stay/stop" -Method POST -ContentType "application/json" -Body '{"guest_fid": 123}'

Write-Host "All API tests completed!"
