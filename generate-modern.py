#!/usr/bin/env python3
"""
Script pour générer index-modern.html avec un design moderne
"""

# Nouveau CSS moderne épuré
MODERN_CSS = """        * { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
            --primary: #6366F1;
            --primary-dark: #4F46E5;
            --accent: #EC4899;
            --gray-50: #F9FAFB;
            --gray-100: #F3F4F6;
            --gray-200: #E5E7EB;
            --gray-600: #4B5563;
            --gray-700: #374151;
            --gray-900: #111827;
            --radius: 12px;
            --shadow: 0 1px 3px rgba(0,0,0,0.1);
            --shadow-lg: 0 10px 25px rgba(0,0,0,0.15);
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: var(--gray-50);
            color: var(--gray-900);
            line-height: 1.6;
        }

        /* Login Screen - Keep existing gradient but modernize */
        .login-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
            padding: 20px;
        }

        .login-box {
            background: white;
            border-radius: 24px;
            padding: 48px 40px;
            max-width: 420px;
            width: 100%;
            box-shadow: var(--shadow-lg);
        }

        .login-logo { font-size: 56px; text-align: center; margin-bottom: 16px; }
        .login-title { font-size: 28px; font-weight: 700; text-align: center; margin-bottom: 8px; }
        .login-subtitle { font-size: 15px; text-align: center; color: var(--gray-600); margin-bottom: 32px; }

        .form-group { margin-bottom: 20px; }
        .form-label { display: block; font-size: 14px; font-weight: 600; color: var(--gray-700); margin-bottom: 8px; }
        .form-input {
            width: 100%;
            padding: 14px 16px;
            border: 2px solid var(--gray-200);
            border-radius: var(--radius);
            font-size: 15px;
            transition: all 0.2s;
        }
        .form-input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .btn {
            width: 100%;
            padding: 14px;
            border: none;
            border-radius: var(--radius);
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn-primary {
            background: var(--primary);
            color: white;
        }
        .btn-primary:hover {
            background: var(--primary-dark);
            transform: translateY(-1px);
            box-shadow: var(--shadow);
        }
        .btn-secondary {
            background: var(--gray-100);
            color: var(--gray-700);
        }
        .btn-secondary:hover { background: var(--gray-200); }

        .divider {
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 24px 0;
            color: var(--gray-600);
            font-size: 14px;
        }
        .divider::before, .divider::after {
            content: '';
            flex: 1;
            height: 1px;
            background: var(--gray-200);
        }

        .link {
            color: var(--primary);
            text-decoration: none;
            font-weight: 600;
            cursor: pointer;
        }
        .link:hover { text-decoration: underline; }

        /* App Container */
        .app-container {
            display: none;
            min-height: 100vh;
        }
        .app-container.show {
            display: flex;
            flex-direction: column;
        }

        /* Sidebar - Desktop Only */
        .sidebar {
            display: none;
        }

        /* Main Content */
        .main {
            flex: 1;
            padding: 16px;
            padding-bottom: 80px;
            overflow-y: auto;
        }

        /* Topbar - Mobile */
        .topbar {
            position: sticky;
            top: 0;
            background: white;
            border-bottom: 1px solid var(--gray-200);
            padding: 12px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 100;
        }
        .project-selector {
            font-size: 18px;
            font-weight: 700;
            color: var(--gray-900);
            cursor: pointer;
        }
        .user-avatar-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--primary);
            color: white;
            border: none;
            font-weight: 600;
            cursor: pointer;
        }

        /* Bottom Nav - Mobile */
        .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            border-top: 1px solid var(--gray-200);
            display: flex;
            justify-content: space-around;
            padding: 8px 0 env(safe-area-inset-bottom);
            z-index: 100;
        }
        .nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding: 8px 16px;
            border: none;
            background: none;
            color: var(--gray-600);
            font-size: 11px;
            cursor: pointer;
            transition: color 0.2s;
        }
        .nav-item.active { color: var(--primary); font-weight: 600; }
        .nav-item svg { width: 24px; height: 24px; }

        /* FAB */
        #addBtn {
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: var(--primary);
            color: white;
            border: none;
            font-size: 24px;
            box-shadow: var(--shadow-lg);
            cursor: pointer;
            z-index: 50;
        }
        #addBtn:hover { background: var(--primary-dark); transform: scale(1.05); }

        /* Calendar */
        .calendar {
            background: white;
            border-radius: var(--radius);
            padding: 16px;
            margin-bottom: 16px;
            box-shadow: var(--shadow);
        }
        .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        .calendar-month { font-size: 18px; font-weight: 700; }
        .calendar-nav button {
            background: var(--gray-100);
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            cursor: pointer;
            margin: 0 4px;
        }
        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 4px;
        }
        .calendar-day {
            aspect-ratio: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
        }
        .calendar-day:hover { background: var(--gray-100); }
        .calendar-day.today { background: var(--primary); color: white; font-weight: 700; }
        .calendar-day.other-month { color: var(--gray-400); }

        /* Activity Cards */
        .activity-card {
            background: white;
            border-radius: var(--radius);
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: var(--shadow);
            cursor: pointer;
            transition: all 0.2s;
        }
        .activity-card:hover {
            box-shadow: var(--shadow-lg);
            transform: translateY(-2px);
        }
        .activity-title { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
        .activity-meta {
            display: flex;
            gap: 16px;
            font-size: 14px;
            color: var(--gray-600);
        }

        /* Modals */
        .modal {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
        }
        .modal.show { display: flex; }
        .modal-content {
            background: white;
            border-radius: 20px;
            max-width: 500px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
        }
        .modal-header {
            padding: 24px;
            border-bottom: 1px solid var(--gray-200);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .modal-title { font-size: 20px; font-weight: 700; }
        .modal-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: var(--gray-600);
        }
        .modal-body { padding: 24px; }
        .modal-footer {
            padding: 24px;
            border-top: 1px solid var(--gray-200);
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }

        /* Responsive */
        @media (min-width: 768px) {
            .app-container.show { flex-direction: row; }
            .topbar, .bottom-nav { display: none; }
            .sidebar {
                display: flex;
                flex-direction: column;
                width: 300px;
                background: white;
                border-right: 1px solid var(--gray-200);
            }
            .sidebar-header {
                padding: 24px;
                border-bottom: 1px solid var(--gray-200);
            }
            .main {
                padding: 32px;
                padding-bottom: 32px;
            }
            #addBtn {
                bottom: 32px;
                right: 32px;
            }
        }"""

# Lire le fichier index.html
with open('/Users/loic/Documents/Claude-Code/Holiday planning/index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Trouver les balises <style> et </style>
style_start = None
style_end = None
for i, line in enumerate(lines):
    if '<style>' in line:
        style_start = i
    if '</style>' in line:
        style_end = i
        break

# Remplacer le CSS
new_lines = lines[:style_start+1]  # Jusqu'à <style>
new_lines.append(MODERN_CSS + '\n')
new_lines.extend(lines[style_end:])  # De </style> à la fin

# Écrire le nouveau fichier
with open('/Users/loic/Documents/Claude-Code/Holiday planning/index-modern.html', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("✅ index-modern.html créé avec succès!")
print(f"- Ancien CSS: {style_end - style_start} lignes")
print(f"- Nouveau CSS: beaucoup plus compact et moderne")
