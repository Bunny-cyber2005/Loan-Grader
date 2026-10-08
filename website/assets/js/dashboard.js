/**
 * JPMC Loan Grader — Dashboard Charts Module
 * All Chart.js configurations for the analytics dashboard
 */

const gc = ['#2ecc71','#27ae60','#f39c12','#e67e22','#e74c3c','#c0392b'];
const grades = ['A','B','C','D','E','F'];

const dark = {
  plugins: {
    legend: { labels: { color:'#8b949e', font:{ size:11 } } },
    tooltip: {
      backgroundColor:'#161b22', borderColor:'#30363d', borderWidth:1,
      titleColor:'#e6edf3', bodyColor:'#8b949e'
    }
  },
  scales: {
    x: { ticks:{ color:'#8b949e', font:{ size:10 } }, grid:{ color:'#21262d' } },
    y: { ticks:{ color:'#8b949e', font:{ size:10 } }, grid:{ color:'#21262d' } }
  },
  responsive: true
};

function ctx(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  return el.getContext('2d');
}

function initCharts() {

  // ── Grade Bar ──────────────────────────────────────────────────
  if (ctx('gradeBarChart')) {
    new Chart(ctx('gradeBarChart'), {
      type: 'bar',
      data: {
        labels: grades,
        datasets: [{
          label: 'Customers',
          data: [70, 2539, 2142, 174, 32, 43],
          backgroundColor: gc, borderWidth: 0, borderRadius: 6
        }]
      },
      options: { ...dark, plugins: { ...dark.plugins, legend: { display: false } } }
    });
  }

  // ── Grade Pie ──────────────────────────────────────────────────
  if (ctx('gradePieChart')) {
    new Chart(ctx('gradePieChart'), {
      type: 'doughnut',
      data: {
        labels: grades.map(g => `Grade ${g}`),
        datasets: [{ data: [70, 2539, 2142, 174, 32, 43], backgroundColor: gc, borderWidth: 0 }]
      },
      options: {
        responsive: true, cutout: '60%',
        plugins: {
          legend: { position:'right', labels:{ color:'#8b949e', font:{ size:11 } } },
          tooltip: dark.plugins.tooltip
        }
      }
    });
  }

  // ── Gender ────────────────────────────────────────────────────
  if (ctx('genderChart')) {
    new Chart(ctx('genderChart'), {
      type: 'doughnut',
      data: {
        labels: ['Male','Female'],
        datasets: [{ data: [55,45], backgroundColor: ['#1f6feb','#e74c3c'], borderWidth: 0 }]
      },
      options: {
        responsive: true, cutout: '60%',
        plugins: {
          legend: { position:'bottom', labels:{ color:'#8b949e', font:{ size:11 } } },
          tooltip: dark.plugins.tooltip
        }
      }
    });
  }

  // ── Marital ───────────────────────────────────────────────────
  if (ctx('maritalChart')) {
    new Chart(ctx('maritalChart'), {
      type: 'doughnut',
      data: {
        labels: ['Married','Single','Divorced'],
        datasets: [{ data: [50,35,15], backgroundColor: ['#2ecc71','#3498db','#e67e22'], borderWidth: 0 }]
      },
      options: {
        responsive: true, cutout: '60%',
        plugins: {
          legend: { position:'bottom', labels:{ color:'#8b949e', font:{ size:11 } } },
          tooltip: dark.plugins.tooltip
        }
      }
    });
  }

  // ── Employment ────────────────────────────────────────────────
  if (ctx('employmentChart')) {
    new Chart(ctx('employmentChart'), {
      type: 'doughnut',
      data: {
        labels: ['Salaried','Self-Employed','Business Owner','Unemployed'],
        datasets: [{ data: [50,25,15,10], backgroundColor: ['#1f6feb','#2ecc71','#f39c12','#e74c3c'], borderWidth: 0 }]
      },
      options: {
        responsive: true, cutout: '60%',
        plugins: {
          legend: { position:'bottom', labels:{ color:'#8b949e', font:{ size:11 } } },
          tooltip: dark.plugins.tooltip
        }
      }
    });
  }

  // ── Income ────────────────────────────────────────────────────
  if (ctx('incomeChart')) {
    new Chart(ctx('incomeChart'), {
      type: 'bar',
      data: {
        labels: ['<30K','30–50K','50–75K','75–100K','100–150K','150K+'],
        datasets: [{ label:'Customers', data:[380,820,1350,1100,900,450], backgroundColor:'#1f6feb', borderWidth:0, borderRadius:5 }]
      },
      options: { ...dark, plugins: { ...dark.plugins, legend: { display: false } } }
    });
  }

  // ── Credit Score Box (simulated median bars) ──────────────────
  if (ctx('creditBoxChart')) {
    new Chart(ctx('creditBoxChart'), {
      type: 'bar',
      data: {
        labels: grades,
        datasets: [{ label:'Median Score', data:[840,750,650,555,455,355], backgroundColor: gc, borderWidth:0, borderRadius:6 }]
      },
      options: { ...dark, plugins:{ ...dark.plugins, legend:{ display:false } }, scales:{ ...dark.scales, y:{ ...dark.scales.y, min:250, max:950 } } }
    });
  }

  // ── Credit Score Stacked Range ────────────────────────────────
  if (ctx('creditRangeChart')) {
    new Chart(ctx('creditRangeChart'), {
      type: 'bar',
      data: {
        labels: grades,
        datasets: [
          { data:[300,400,500,600,700,800], backgroundColor:'transparent', borderColor:'transparent' },
          { label:'Score Band', data:[100,100,100,100,100,100], backgroundColor: gc.map(c => c+'99'), borderColor: gc, borderWidth:2, borderRadius:6 }
        ]
      },
      options: {
        ...dark,
        plugins: { ...dark.plugins, legend: { display: false } },
        scales: {
          x: { stacked:true, ticks:{ color:'#8b949e' }, grid:{ color:'#21262d' } },
          y: { stacked:true, min:250, max:950, ticks:{ color:'#8b949e' }, grid:{ color:'#21262d' } }
        }
      }
    });
  }

  // ── Credit Utilization ────────────────────────────────────────
  if (ctx('utilizationChart')) {
    new Chart(ctx('utilizationChart'), {
      type: 'bar',
      data: {
        labels: grades,
        datasets: [{ label:'Avg Utilization', data:[0.15,0.22,0.38,0.55,0.72,0.85], backgroundColor: gc, borderWidth:0, borderRadius:5 }]
      },
      options: {
        ...dark,
        plugins: { ...dark.plugins, legend: { display: false } },
        scales: { ...dark.scales, y: { ...dark.scales.y, min:0, max:1, ticks:{ color:'#8b949e', callback: v => `${(v*100).toFixed(0)}%` } } }
      }
    });
  }

  // ── Late Payments ─────────────────────────────────────────────
  if (ctx('latePayChart')) {
    new Chart(ctx('latePayChart'), {
      type: 'bar',
      data: {
        labels: grades,
        datasets: [{ label:'Avg Late Payments', data:[0.3,0.8,1.4,2.1,3.2,4.5], backgroundColor: gc, borderWidth:0, borderRadius:5 }]
      },
      options: { ...dark, plugins: { ...dark.plugins, legend: { display: false } } }
    });
  }

  // ── Debt-to-Income ────────────────────────────────────────────
  if (ctx('dtiChart')) {
    new Chart(ctx('dtiChart'), {
      type: 'bar',
      data: {
        labels: grades,
        datasets: [{ label:'Avg DTI', data:[0.15,0.28,0.42,0.58,0.72,0.88], backgroundColor: gc, borderWidth:0, borderRadius:5 }]
      },
      options: { ...dark, plugins: { ...dark.plugins, legend: { display: false } } }
    });
  }

  // ── Loan Repayment % ──────────────────────────────────────────
  if (ctx('repayChart')) {
    new Chart(ctx('repayChart'), {
      type: 'bar',
      data: {
        labels: grades,
        datasets: [{ label:'Avg Repayment %', data:[0.97,0.93,0.85,0.72,0.58,0.40], backgroundColor: gc, borderWidth:0, borderRadius:5 }]
      },
      options: {
        ...dark,
        plugins: { ...dark.plugins, legend: { display: false } },
        scales: { ...dark.scales, y: { ...dark.scales.y, min:0, max:1, ticks:{ color:'#8b949e', callback: v => `${(v*100).toFixed(0)}%` } } }
      }
    });
  }

  // ── Feature Importances ───────────────────────────────────────
  if (ctx('featureChart')) {
    new Chart(ctx('featureChart'), {
      type: 'bar',
      data: {
        labels: ['credit_score','loan_repayment_pct','credit_utilization','debt_to_income','annual_income','num_late_payments','monthly_emi','num_loan_defaults','savings_balance','monthly_balance','total_loan_amount','num_card_defaults'],
        datasets: [{
          label: 'Importance',
          data: [0.421,0.128,0.097,0.082,0.064,0.041,0.033,0.029,0.021,0.018,0.015,0.012],
          backgroundColor: [0.421,0.128,0.097,0.082,0.064,0.041,0.033,0.029,0.021,0.018,0.015,0.012].map((_,i) => i < 3 ? '#2ecc71' : i < 6 ? '#1f6feb' : '#30363d'),
          borderWidth: 0, borderRadius: 4
        }]
      },
      options: {
        ...dark, indexAxis: 'y',
        plugins: { ...dark.plugins, legend: { display: false } },
        scales: {
          x: { ...dark.scales.x, min: 0 },
          y: { ticks:{ color:'#8b949e', font:{ size:10 } }, grid:{ display:false } }
        }
      }
    });
  }

  // ── Outliers ──────────────────────────────────────────────────
  if (ctx('outlierChart')) {
    new Chart(ctx('outlierChart'), {
      type: 'bar',
      data: {
        labels: ['annual_income','savings_balance','total_loan_amount','monthly_emi','credit_limit','monthly_card_spend','monthly_deposits','monthly_withdrawals','monthly_balance','num_late_payments'],
        datasets: [{
          label: 'Outlier Count',
          data: [156,132,121,98,87,74,63,59,47,32],
          backgroundColor: '#e67e22', borderWidth: 0, borderRadius: 4
        }]
      },
      options: {
        ...dark, indexAxis: 'y',
        plugins: { ...dark.plugins, legend: { display: false } },
        scales: {
          x: { ...dark.scales.x, min: 0 },
          y: { ticks:{ color:'#8b949e', font:{ size:10 } }, grid:{ display:false } }
        }
      }
    });
  }

  // ── Missing Values ────────────────────────────────────────────
  if (ctx('missingChart')) {
    new Chart(ctx('missingChart'), {
      type: 'bar',
      data: {
        labels: ['annual_income','credit_utilization','loan_repayment_pct','monthly_balance','monthly_emi'],
        datasets: [{
          label: 'Missing %',
          data: [3.0,3.1,2.9,2.8,3.2],
          backgroundColor: '#e74c3c', borderWidth: 0, borderRadius: 5
        }]
      },
      options: {
        ...dark,
        plugins: { ...dark.plugins, legend: { display: false } },
        scales: { ...dark.scales, y: { ...dark.scales.y, min:0, max:5, ticks:{ color:'#8b949e', callback: v => `${v}%` } } }
      }
    });
  }
}

// ── Tab switcher ──────────────────────────────────────────────
function switchTab(btn, paneId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(paneId).classList.add('active');
}

window.addEventListener('DOMContentLoaded', initCharts);
