 // Initialize local storage
        let productionRecords = JSON.parse(localStorage.getItem('productionRecords')) || [];
        // ensure old records have groupSection
        productionRecords = productionRecords.map(rec => ({
            groupSection: (rec.groupSection !== undefined && rec.groupSection !== null) ? String(rec.groupSection) : '',
            date: rec.date,
            bittersQuantity: rec.bittersQuantity || 0,
            gingerQuantity: rec.gingerQuantity || 0,
            employees: rec.employees || 0
        }));
        // current user/group name persisted in localStorage
        let currentUser = localStorage.getItem('currentUser') || '';
        // Hold data for the currently displayed weekly report so it can be printed
        let currentWeeklyData = null;

        // Save to local storage
        function saveToLocalStorage() {
            localStorage.setItem('productionRecords', JSON.stringify(productionRecords));
        }

        // Show selected tab
        function showTab(tabName, button) {
            // Update tab buttons
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            button.classList.add('active');

            // Update tab content
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            document.getElementById(tabName).classList.add('active');

            // Save active tab to localStorage
            localStorage.setItem('activeTab', tabName);

            // Refresh data if needed
            if (tabName === 'records') {
                displayAllRecords();
            } else if (tabName === 'weekly') {
                // Set default week to current week
                const today = new Date();
                const year = today.getFullYear();
                const week = getWeekNumber(today);
                document.getElementById('weekSelector').value = `${year}-W${week.toString().padStart(2, '0')}`;
            }
        }

        // Get week number
        function getWeekNumber(date) {
            const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
            const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
            return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        }

        // Format date
        function formatDate(dateString) {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        }

        // Show message
        function showMessage(message, type) {
            const messageDiv = document.createElement('div');
            messageDiv.className = type === 'error' ? 'error-message' : 'success-message';
            messageDiv.textContent = message;

            const container = document.querySelector('.tab-pane.active');
            container.insertBefore(messageDiv, container.firstChild);

            setTimeout(() => {
                messageDiv.remove();
            }, 3000);
        }

        // Handle form submission
        document.getElementById('productionForm').addEventListener('submit', function(e) {
            e.preventDefault();
            if (!currentUser) {
                showMessage('Please log in with your group name before adding records.', 'error');
                loginModal.style.display = 'block';
                return;
            }
            const groupSection = currentUser; // use logged-in name
            const date = document.getElementById('date').value;
            const bittersQuantity = parseFloat(document.getElementById('bittersQuantity').value);
            const gingerQuantity = parseFloat(document.getElementById('gingerQuantity').value);
            const employees = parseInt(document.getElementById('employees').value);

            // Check if record for this date and group already exists
            const existingRecordIndex = productionRecords.findIndex(record => record.date === date && record.groupSection === groupSection);

            if (existingRecordIndex !== -1) {
                if (!confirm('A record for this date and group already exists. Do you want to update it?')) {
                    return;
                }
                // Update existing record
                productionRecords[existingRecordIndex] = {
                    groupSection,
                    date,
                    bittersQuantity,
                    gingerQuantity,
                    employees
                };
            } else {
                // Add new record
                productionRecords.push({
                    groupSection,
                    date,
                    bittersQuantity,
                    gingerQuantity,
                    employees
                });
            }

            // Sort records by date
            productionRecords.sort((a, b) => {
                if (a.date === b.date) return a.groupSection.localeCompare(b.groupSection);
                return new Date(b.date) - new Date(a.date);
            });

            saveToLocalStorage();
            showMessage('Record saved successfully!', 'success');

            // Reset form
            this.reset();

            // Refresh records display if on that tab
            if (document.getElementById('records').classList.contains('active')) {
                displayAllRecords();
            }
        });

        // Display all records
        function displayAllRecords() {
            const tbody = document.getElementById('recordsBody');

            if (productionRecords.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No records found</td></tr>';
                return;
            }

            tbody.innerHTML = productionRecords.map(record => {
                const productivity = ((record.bittersQuantity + record.gingerQuantity) / record.employees).toFixed(2);

                return `
                    <tr>
                        <td>${formatDate(record.date)}</td>
                        <td>${record.bittersQuantity.toFixed(1)} drinks</td>
                        <td>${record.gingerQuantity.toFixed(1)} drinks</td>
                        <td>${record.employees}</td>
                        <td>${productivity} drinks/employee</td>
                        <td>
                            <button class="btn-update" onclick="openEditModal(${JSON.stringify(record.date)}, ${JSON.stringify(record.groupSection)})" style="padding: 5px 10px; font-size: 0.9em; margin-right: 5px;">Update</button>
                            <button class="btn-danger" onclick="deleteRecord(${JSON.stringify(record.date)}, ${JSON.stringify(record.groupSection)})" style="padding: 5px 10px; font-size: 0.9em;">Delete</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // Open edit modal
        function openEditModal(date, group) {
            const record = productionRecords.find(r => r.date === date && r.groupSection === group);
            if (!record) return;

            // Store original identifiers
            window.editingRecordDate = date;
            window.editingRecordGroup = group;

            // Populate modal with record data
            document.getElementById('editGroupSection').value = record.groupSection;
            document.getElementById('editDate').value = record.date;
            document.getElementById('editBittersQuantity').value = record.bittersQuantity;
            document.getElementById('editGingerQuantity').value = record.gingerQuantity;
            document.getElementById('editEmployees').value = record.employees;

            // Show modal
            document.getElementById('editModal').style.display = 'block';
        }

        // Close edit modal
        function closeEditModal() {
            document.getElementById('editModal').style.display = 'none';
            window.editingRecordDate = null;
        }

        // Handle edit form submission
        document.getElementById('editForm').addEventListener('submit', function(e) {
            e.preventDefault();

            const originalDate = window.editingRecordDate;
            const originalGroup = window.editingRecordGroup;
            const newGroup = document.getElementById('editGroupSection').value.trim();
            const newDate = document.getElementById('editDate').value;
            const bittersQuantity = parseFloat(document.getElementById('editBittersQuantity').value);
            const gingerQuantity = parseFloat(document.getElementById('editGingerQuantity').value);
            const employees = parseInt(document.getElementById('editEmployees').value);

            // Check if new date+group already exists (and is different)
            if (newDate !== originalDate || newGroup !== originalGroup) {
                const exists = productionRecords.some(record => record.date === newDate && record.groupSection === newGroup);
                if (exists) {
                    showMessage('A record for this group and date already exists. Please choose different values.', 'error');
                    return;
                }
            }

            // Find and update the record
            const recordIndex = productionRecords.findIndex(r => r.date === originalDate && r.groupSection === originalGroup);
            if (recordIndex !== -1) {
                productionRecords[recordIndex] = {
                    groupSection: newGroup,
                    date: newDate,
                    bittersQuantity,
                    gingerQuantity,
                    employees
                };

                // Sort records by date (and group maybe)
                productionRecords.sort((a, b) => {
                    if (a.date === b.date) return a.groupSection.localeCompare(b.groupSection);
                    return new Date(b.date) - new Date(a.date);
                });

                saveToLocalStorage();
                displayAllRecords();
                showMessage('Record updated successfully!', 'success');
                closeEditModal();
            }
        });

        // Delete record
        function deleteRecord(date, group) {
            if (confirm('Are you sure you want to delete this record?')) {
                productionRecords = productionRecords.filter(record => !(record.date === date && record.groupSection === group));
                saveToLocalStorage();
                displayAllRecords();
                showMessage('Record deleted successfully!', 'success');
            }
        }

        // Clear all records
        function clearAllRecords() {
            if (confirm('Are you sure you want to delete all records? This action cannot be undone.')) {
                productionRecords = [];
                saveToLocalStorage();
                displayAllRecords();
                showMessage('All records cleared!', 'success');
            }
        }

        // Generate weekly report
        function generateWeeklyReport() {
            const weekValue = document.getElementById('weekSelector').value;
            if (!weekValue) {
                showMessage('Please select a week', 'error');
                return;
            }

            const [year, week] = weekValue.split('-W');
            const weekNumber = parseInt(week);

            // Filter records for the selected week
            const weeklyRecords = productionRecords.filter(record => {
                const recordDate = new Date(record.date);
                const recordYear = recordDate.getFullYear();
                const recordWeek = getWeekNumber(recordDate);
                return recordYear === parseInt(year) && recordWeek === weekNumber;
            }).sort((a, b) => {
                // primary sort by date ascending
                const da = new Date(a.date);
                const db = new Date(b.date);
                if (da - db !== 0) return da - db;
                return a.groupSection.localeCompare(b.groupSection);
            });

            if (weeklyRecords.length === 0) {
                document.getElementById('weeklyReport').innerHTML = '<p>No records found for this week.</p>';
                currentWeeklyData = null;
                return;
            }

            // Calculate weekly totals
            const totalBitters = weeklyRecords.reduce((sum, record) => sum + record.bittersQuantity, 0);
            const totalGinger = weeklyRecords.reduce((sum, record) => sum + record.gingerQuantity, 0);
            const avgEmployees = (weeklyRecords.reduce((sum, record) => sum + record.employees, 0) / weeklyRecords.length).toFixed(1);

            // Calculate daily productivity
            const dailyProductivity = weeklyRecords.map(record =>
                ((record.bittersQuantity + record.gingerQuantity) / record.employees).toFixed(2)
            );

            const avgProductivity = (dailyProductivity.reduce((sum, val) => sum + parseFloat(val), 0) / dailyProductivity.length).toFixed(2);

            // store report data for PDF
            currentWeeklyData = {
                weekLabel: weekValue,
                totalBitters,
                totalGinger,
                avgEmployees,
                avgProductivity,
                weeklyRecords
            };

            // Generate report HTML
            const reportHTML = `
                ${currentUser ? `<p><strong>Group: ${currentUser}</strong></p>` : ''}
                <div class="summary-cards">
                    <div class="summary-card">
                        <h3>Total Bitters</h3>
                        <div class="value">${totalBitters.toFixed(1)} drinks</div>
                    </div>
                    <div class="summary-card">
                        <h3>Total Ginger</h3>
                        <div class="value">${totalGinger.toFixed(1)} drinks</div>
                    </div>
                    <div class="summary-card">
                        <h3>Avg. Employees</h3>
                        <div class="value">${avgEmployees}</div>
                    </div>
                    <div class="summary-card">
                        <h3>Avg. Productivity</h3>
                        <div class="value">${avgProductivity} drinks/emp</div>
                    </div>
                </div>

                <h3>Daily Breakdown</h3>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Day</th>
                                <th>Date</th>
                                <th>Bitters (drinks)</th>
                                <th>Ginger (drinks)</th>

                                <th>Employees</th>
                                <th>Productivity</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${weeklyRecords.map((record,index) => {
                                const productivity = ((record.bittersQuantity + record.gingerQuantity) / record.employees).toFixed(2);
                                const dayName = new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' });

                                return `
                                    <tr>
                                        <td>${index+1}</td>
                                        <td>${dayName}</td>
                                        <td>${formatDate(record.date)}</td>
                                        <td>${record.bittersQuantity.toFixed(1)} drinks</td>
                                        <td>${record.gingerQuantity.toFixed(1)} drinks</td>
                                        <td>${record.employees}</td>
                                        <td>${productivity} drinks/emp</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById('weeklyReport').innerHTML = reportHTML;
        }

        // Download report as PDF using jsPDF text rendering
        function printReport() {
            // If no report data exists, generate it first
            if (!currentWeeklyData) {
                generateWeeklyReport();
                // If still no data after generation, show error
                if (!currentWeeklyData) {
                    showMessage('Please select a week and generate a report first', 'error');
                    return;
                }
            }
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            let y = 20;
            doc.setFontSize(16);
            doc.text('Weekly Production Report', 20, y);
            y += 10;
            if (currentUser) {
                doc.setFontSize(12);
                doc.text(`Group: ${currentUser}`, 20, y);
                y += 10;
            }
            doc.setFontSize(12);
            doc.text(`Week: ${currentWeeklyData.weekLabel}`, 20, y);
            y += 10;
            doc.text(`Total Bitters: ${currentWeeklyData.totalBitters.toFixed(1)} drinks`, 20, y);
            y += 7;
            doc.text(`Total Ginger: ${currentWeeklyData.totalGinger.toFixed(1)} drinks`, 20, y);
            y += 7;
            doc.text(`Avg. Employees: ${currentWeeklyData.avgEmployees}`, 20, y);
            y += 7;
            doc.text(`Avg. Productivity: ${currentWeeklyData.avgProductivity} drinks/emp`, 20, y);
            y += 10;
            doc.setFontSize(14);
            doc.text('Daily Breakdown', 20, y);
            y += 10;
            doc.setFontSize(10);

            // Table configuration
            const tableStartX = 8;
            const tableStartY = y;
            const colWidths = [12, 20, 38, 28, 28, 38, 20]; // No., Day, Date, Bitters, Ginger, Employees, Prod.
            const colLabels = ['No.', 'Day', 'Date', 'Bitters', 'Ginger', 'Employees', 'Prod.'];
            const rowHeight = 7;
            let currentY = tableStartY;

            // Draw header background
            doc.setFillColor(200, 200, 200);
            let xPos = tableStartX;
            for (let i = 0; i < colWidths.length; i++) {
                doc.rect(xPos, currentY, colWidths[i], rowHeight, 'F');
                xPos += colWidths[i];
            }

            // Draw header borders and text
            doc.setDrawColor(0);
            doc.setLineWidth(0.5);
            xPos = tableStartX;
            for (let i = 0; i < colWidths.length; i++) {
                doc.rect(xPos, currentY, colWidths[i], rowHeight);
                doc.text(colLabels[i], xPos + 1, currentY + 4);
                xPos += colWidths[i];
            }
            currentY += rowHeight;

            // Draw data rows
            currentWeeklyData.weeklyRecords.forEach((rec, index) => {
                if (currentY > 270) {
                    doc.addPage();
                    currentY = 20;
                }
                const dayName = new Date(rec.date).toLocaleDateString('en-US', { weekday: 'short' });
                const rowData = [
                    (index+1).toString(),
                    dayName,
                    formatDate(rec.date),
                    rec.bittersQuantity.toFixed(1),
                    rec.gingerQuantity.toFixed(1),
                    rec.employees.toString(),
                    ((rec.bittersQuantity + rec.gingerQuantity) / rec.employees).toFixed(2)
                ];

                // Draw cell borders and text
                xPos = tableStartX;
                for (let i = 0; i < colWidths.length; i++) {
                    doc.rect(xPos, currentY, colWidths[i], rowHeight);
                    doc.text(rowData[i], xPos + 1, currentY + 4);
                    xPos += colWidths[i];
                }
                currentY += rowHeight;
            });
            doc.save('weekly_report.pdf');
        }

        // Initial display
        displayAllRecords();

        // Set default date to today
        document.getElementById('date').valueAsDate = new Date();

        // login modal elements
        const loginModal = document.getElementById('loginModal');
        const loginForm = document.getElementById('loginForm');
        const loginInput = document.getElementById('loginGroup');
        const userDisplay = document.getElementById('userDisplay');

        function updateUserDisplay() {
            if (currentUser) {
                userDisplay.innerHTML = `Logged in as: <strong>${currentUser}</strong> <a href="#" id="changeUser">(change)</a>`;
                document.getElementById('changeUser').addEventListener('click', function(e) {
                    e.preventDefault();
                    loginModal.style.display = 'block';
                    loginInput.value = currentUser;
                });
            } else {
                userDisplay.textContent = '';
            }
        }

        updateUserDisplay();

        // show login modal if not signed in
        if (!currentUser) {
            loginModal.style.display = 'block';
        }

        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = loginInput.value.trim();
            if (!name) return;
            currentUser = name;
            localStorage.setItem('currentUser', currentUser);
            loginModal.style.display = 'none';
            updateUserDisplay();
        });

        // clicking outside login modal closes it if already logged in
        window.addEventListener('click', function(evt) {
            if (evt.target === loginModal && currentUser) {
                loginModal.style.display = 'none';
            }
        });

        // Initialize week selector
        const weekSelector = document.getElementById('weekSelector');
        const today = new Date();
        const year = today.getFullYear();
        const week = getWeekNumber(today);
        weekSelector.value = `${year}-W${week.toString().padStart(2, '0')}`;

        // Handle week selector changes on mobile
        weekSelector.addEventListener('change', function() {
            // Automatically generate report when week is selected on mobile
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    generateWeeklyReport();
                }, 100);
            }
        });

        // Restore active tab on page load
        window.addEventListener('load', function() {
            const savedTab = localStorage.getItem('activeTab') || 'daily';
            const tabButton = document.querySelector(`button[onclick="showTab('${savedTab}', this)"]`);
            if (tabButton) {
                showTab(savedTab, tabButton);
            }
        });
