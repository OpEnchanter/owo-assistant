import '/js/chart.js';

async function loadStatistics() {
    await fetch('/statistics')
        .then(data => {return data.json(); })
        .then(statistics => {
            const totalQueries = document.getElementById("totalQueries");
            totalQueries.innerText = `Total Queries: ${statistics.totalQueries}`;

            const cumulativeModuleRequestsChart = document.getElementById("cumulativeModuleRequestsChart");
            const dailyTotalRequestsChart = document.getElementById("dailyTotalRequestsChart");

            let humanReadableKeys = [];
            for (let key of Object.keys(statistics.requestsPerDay)) {
                const date = new Date(JSON.parse(key));
                humanReadableKeys.push(date.toDateString());
            }

            console.log(humanReadableKeys.length);

            if (humanReadableKeys.length > 0) {
                new Chart(dailyTotalRequestsChart, {
                    type: 'line',
                    data: {
                        labels: humanReadableKeys,
                        datasets: [{
                            label: 'Total Requests',
                            data: Object.values(statistics.requestsPerDay),
                            fill: false,
                            borderColor: 'rgb(75, 192, 192)',
                            tension: 0.1
                        }]
                    },
                });

                new Chart(cumulativeModuleRequestsChart, {
                    type: 'pie',
                    data: {
                        labels: Object.keys(statistics.moduleRequests),
                        datasets: [
                            {
                                data: Object.values(statistics.moduleRequests)
                            }
                        ]
                    }
                });
            } else {
                console.log("No data!");
                dailyTotalRequestsChart.parentElement.remove();
                cumulativeModuleRequestsChart.parentElement.remove();
            }

            
        });
}
loadStatistics();