# Update main.py with enhanced booking system endpoints
# Append to existing content

# Read existing main.py
$content = Get-Content -Path 'C:\Users\saaja\Downloads\EY\backend\main.py' -Raw

# Add new endpoints before the analytics section
$newEndpoints = @'

# ----------------------------
# ENHANCED SERVICE CENTRE ENDPOINTS  
# ----------------------------

@app.get('/service/centres')
def get_all_centres():
    '''Get all service centres'''
    import service
    return service.get_all_service_centres()

@app.put('/service/booking/{booking_id}/status')
def update_booking_status(booking_id: str, payload: dict):
    '''Update booking status'''
    import service
    service.update_booking_status(
        booking_id=booking_id,
        status=payload['status'],
        notes=payload.get('notes', ''),
        current_role=payload['role']
    )
    return {'status': 'success'}

'@

# Find the position to insert (before analytics)
$insertPosition = $content.IndexOf('# ----------------------------')
if ($insertPosition -gt 0) {
    $before = $content.Substring(0, $insertPosition)
    $after = $content.Substring($insertPosition)
    $newContent = $before + $newEndpoints + $after
    $newContent | Out-File -FilePath 'C:\Users\saaja\Downloads\EY\backend\main.py' -Encoding utf8
    Write-Host 'Updated main.py successfully'
} else {
    Write-Host 'Could not find insertion point'
}
