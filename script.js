// Interactive Presentation Logic for Claude Chat & Cowork Slides

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const slides = document.querySelectorAll('.slide');
  const menuItems = document.querySelectorAll('.menu-item');
  const progressBar = document.querySelector('.progress-bar');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const counterSpan = document.getElementById('current-slide-counter');
  const sidebar = document.getElementById('sidebar');
  const toggleSidebarBtn = document.getElementById('toggle-sidebar');
  const toggleSidebarIcon = (toggleSidebarBtn && toggleSidebarBtn.querySelector('span')) || null;
  const fullscreenBtn = document.getElementById('toggle-fullscreen');
  const toast = document.getElementById('toast');

  let currentSlideIndex = 0;

  // Initialize
  showSlide(currentSlideIndex);

  // 1. Navigation Functions
  function showSlide(index) {
    if (index < 0 || index >= slides.length) return;

    // Remove active class from current slide
    slides.forEach(slide => slide.classList.remove('active'));
    menuItems.forEach(item => item.classList.remove('active'));

    // Set new active slide
    currentSlideIndex = index;
    slides[currentSlideIndex].classList.add('active');

    // Update Counter
    if (counterSpan) {
      counterSpan.textContent = `${currentSlideIndex + 1} / ${slides.length}`;
    }

    // Update Progress Bar
    if (progressBar) {
      const progress = ((currentSlideIndex + 1) / slides.length) * 100;
      progressBar.style.width = `${progress}%`;
    }

    // Highlight menu item
    const targetMenuId = `menu-slide-${currentSlideIndex}`;
    const activeMenuItem = document.getElementById(targetMenuId);
    if (activeMenuItem) {
      activeMenuItem.classList.add('active');
      activeMenuItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    // Disable/Enable nav buttons
    if (prevBtn) {
      prevBtn.disabled = currentSlideIndex === 0;
    }
    // If last slide, change next button text or disable
    if (nextBtn) {
      if (currentSlideIndex === slides.length - 1) {
        nextBtn.innerHTML = '結束 <span>➔</span>';
      } else {
        nextBtn.innerHTML = '下一步 <span>➔</span>';
      }
    }

    // Dispatch a custom resize event to make sure any widgets inside redraw if needed
    window.dispatchEvent(new Event('resize'));
  }

  function nextSlide() {
    if (currentSlideIndex < slides.length - 1) {
      showSlide(currentSlideIndex + 1);
    } else {
      showToast('簡報播放完畢，謝謝！');
    }
  }

  function prevSlide() {
    if (currentSlideIndex > 0) {
      showSlide(currentSlideIndex - 1);
    }
  }

  // 2. Navigation Event Listeners
  if (nextBtn) nextBtn.addEventListener('click', nextSlide);
  if (prevBtn) prevBtn.addEventListener('click', prevSlide);

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    // If typing in textarea, don't trigger slide change
    if (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT') {
      return;
    }

    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === 'Space') {
      e.preventDefault();
      nextSlide();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      prevSlide();
    }
  });

  // Sidebar Menu Jump
  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const slideIndex = parseInt(item.getAttribute('data-slide-index'), 10);
      showSlide(slideIndex);
    });
  });

  // Toggle Sidebar Collapse
  if (toggleSidebarBtn && sidebar) {
    toggleSidebarBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      if (toggleSidebarIcon) {
        if (sidebar.classList.contains('collapsed')) {
          toggleSidebarIcon.textContent = 'menu_open';
        } else {
          toggleSidebarIcon.textContent = 'menu';
        }
      }
    });
  }

  // Toggle Fullscreen Mode
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          showToast(`無法啟動全螢幕模式: ${err.message}`);
        });
        const fullscreenIcon = fullscreenBtn.querySelector('span');
        if (fullscreenIcon) fullscreenIcon.textContent = 'fullscreen_exit';
        if (sidebar) sidebar.classList.add('collapsed');
        if (toggleSidebarIcon) toggleSidebarIcon.textContent = 'menu_open';
      } else {
        document.exitFullscreen();
        const fullscreenIcon = fullscreenBtn.querySelector('span');
        if (fullscreenIcon) fullscreenIcon.textContent = 'fullscreen';
        if (sidebar) sidebar.classList.remove('collapsed');
        if (toggleSidebarIcon) toggleSidebarIcon.textContent = 'menu';
      }
    });
  }

  // Global Fullscreen Change Listener (handles Esc key and auto-collapse)
  document.addEventListener('fullscreenchange', () => {
    const fullscreenIcon = fullscreenBtn ? fullscreenBtn.querySelector('span') : null;
    if (document.fullscreenElement) {
      if (sidebar) sidebar.classList.add('collapsed');
      if (toggleSidebarIcon) toggleSidebarIcon.textContent = 'menu_open';
      if (fullscreenIcon) fullscreenIcon.textContent = 'fullscreen_exit';
    } else {
      if (sidebar) sidebar.classList.remove('collapsed');
      if (toggleSidebarIcon) toggleSidebarIcon.textContent = 'menu';
      if (fullscreenIcon) fullscreenIcon.textContent = 'fullscreen';
    }
    // Redraw current active slide to fit the space
    showSlide(currentSlideIndex);
  });

  // Toast helper
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  // 3. Interactive Prompt Builder Logic
  const builderRole = document.getElementById('prompt-role');
  const builderGoal = document.getElementById('prompt-goal');
  const builderAction = document.getElementById('prompt-action');
  const builderFormat = document.getElementById('prompt-format');
  const builderOutput = document.getElementById('prompt-output-text');
  const copyPromptBtn = document.getElementById('copy-prompt-btn');

  function updateGeneratedPrompt() {
    if (!builderOutput) return;

    const role = builderRole.value;
    const goal = builderGoal.value;
    const action = builderAction.value;
    const format = builderFormat.value;

    let promptText = `你現在扮演一個專業的【${role}】。\n\n`;
    promptText += `【我的目標】\n我希望透過此對話達成以下目標：\n- ${goal}\n\n`;
    promptText += `【具體指令】\n請協助我執行以下任務：\n- ${action}\n\n`;
    promptText += `【格式要求】\n輸出結果請遵循以下規範：\n1. 採用 繁體中文 (Traditional Chinese)。\n2. 格式設定：${format}\n3. 重要：如果涉及本地檔案修改，請在處理前先讀取該目錄下的 CLAUDE.md。`;

    builderOutput.value = promptText;
  }

  // Bind builder select change events
  if (builderRole && builderGoal && builderAction && builderFormat) {
    [builderRole, builderGoal, builderAction, builderFormat].forEach(element => {
      element.addEventListener('change', updateGeneratedPrompt);
    });
    // Init prompt text
    updateGeneratedPrompt();
  }

  // Copy Prompt to Clipboard
  if (copyPromptBtn && builderOutput) {
    copyPromptBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(builderOutput.value)
        .then(() => {
          showToast('Prompt 已複製到剪貼簿！');
        })
        .catch(err => {
          showToast('複製失敗，請手動複製！');
        });
    });
  }

  // 4. Interactive CLAUDE.md Templates (Slide 8)
  const claudeMdRoleSelect = document.getElementById('claude-md-role-select');
  const claudemdCodeBlock = document.getElementById('claudemd-code');
  const copyClaudemdBtn = document.getElementById('copy-claudemd-btn');

  const claudeMdTemplates = {
    "資深財務分析師": `# 專案規則：財務支出分析與決策
- 角色：資深財務分析助理
- 語言偏好：繁體中文 (Traditional Chinese)
- 文件輸出規則：
  1. 暫存與明細報表存入 \`outputs/temp/\`
  2. 正式核決財務報告命名格式：\`財務分析_v1.docx\`
- 專業準則：
  - 遇到缺少欄位時，請使用 AskUserQuestion 詢問，嚴禁自行虛構數字。
  - 對於大額支出 (>10萬) 需額外進行月增率與佔比分析。`,

    "油品與能源市場研究員": `# 專案規則：油品與能源市場追蹤
- 角色：能源市場情報分析助理
- 語言偏好：繁體中文 (Traditional Chinese)
- 資訊監控規則：
  1. 每日 Brent, WTI 原油價格與國際能源署 (IEA) 法規變動摘要。
  2. 新聞摘要存至 \`outputs/news_daily.md\`。
- 專業準則：
  - 引述新聞時必須列出具體發布時間與媒體來源。
  - 遇到法規比對，必須註明對應的條款與修正案號碼。`,

    "行政人資管理顧問": `# 專案規則：人資流程與組織發展
- 角色：行政與人資流程優化助理
- 語言偏好：繁體中文 (Traditional Chinese)
- 行政輸出規則：
  1. 會議記錄大綱格式：【決議事項】、【待辦清單 (Owner/Due Date)】、【延伸討論】。
  2. 報告存入 \`outputs/admin/\`。
- 安全與隱私限制：
  - 嚴禁外傳任何包含員工姓名、身分證、薪資或考績的明細資料。
  - 上傳履歷分析時，自動將人名代換為 "候選人A", "候選人B"。`,

    "專業簡報製作人": `# 專案規則：簡報大綱與商業提案架構
- 角色：商業簡報架構設計師
- 語言偏好：繁體中文 (Traditional Chinese)
- 簡報輸出規則：
  1. 每頁簡報大綱格式：\`[Slide X] [標題] - 3點子標 (Bullet Points)\`
  2. 簡報草案存入 \`outputs/pptx_outline.md\`。
- 設計準則：
  - 遵循 MECE (相互獨立、完全窮盡) 原則。
  - 大綱風格需簡明有力，每一點不超過 15 個字。`,

    "業務開發經理人": `# 專案規則：業務開發與客戶關係管理
- 角色：業務拓展與 CRM 管理助理
- 語言偏好：繁體中文 (Traditional Chinese)
- 業務輸出規則：
  1. 開發信 (Outreach Email) 寫作風格：主旨吸睛、內文精簡、強調雙贏、包含 CTA (行動呼籲)。
  2. 新潛在客戶清單存入 \`outputs/leads_new.xlsx\`。
- 專業準則：
  - 撰寫信件前，自動讀取 \`aboutme/brand-voice.md\` 的公司風格指南。
  - 遇到現有客戶，必須先查詢 CRM 歷史記錄避免重複拜訪。`
  };

  function updateClaudeMdCode() {
    if (!claudemdCodeBlock || !claudeMdRoleSelect) return;
    const selectedRole = claudeMdRoleSelect.value;
    claudemdCodeBlock.textContent = claudeMdTemplates[selectedRole] || '';
  }

  if (claudeMdRoleSelect) {
    claudeMdRoleSelect.addEventListener('change', updateClaudeMdCode);
    updateClaudeMdCode(); // Initialize
  }

  if (copyClaudemdBtn && claudemdCodeBlock) {
    copyClaudemdBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(claudemdCodeBlock.textContent)
        .then(() => {
          showToast('CLAUDE.md 範本已複製！');
        })
        .catch(err => {
          showToast('複製失敗，請手動複製！');
        });
    });
  }

  // 5. Interactive Security Checklist Logic
  const checklistItems = document.querySelectorAll('.checklist-item');
  const securityScoreElement = document.getElementById('security-score');
  const securityIndicator = document.getElementById('security-indicator');

  checklistItems.forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('checked');
      calculateSecurityScore();
    });
  });

  function calculateSecurityScore() {
    if (!securityScoreElement) return;

    const checkedItems = document.querySelectorAll('.checklist-item.checked');
    const totalItems = checklistItems.length;
    const score = Math.round((checkedItems.length / totalItems) * 100);

    securityScoreElement.textContent = `${score} / 100`;

    // Dynamic rating update
    if (score < 40) {
      securityIndicator.textContent = '危險！高洩漏風險 ⚠️';
      securityIndicator.style.color = '#ef4444';
    } else if (score < 80) {
      securityIndicator.textContent = '中度防護，需加強 💡';
      securityIndicator.style.color = '#f59e0b';
    } else {
      securityIndicator.textContent = '安全！合規等級高 🛡️';
      securityIndicator.style.color = '#10b981';
    }
  }
  
  // Initialize checklist score
  calculateSecurityScore();

  // 6. Dynamic Case Study Tabs Logic (Slide 9)
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Avoid interference with other tab widgets by checking parent context
      const container = btn.closest('.case-study-widget');
      if (!container) return;

      const btns = container.querySelectorAll('.tab-btn');
      const panes = container.querySelectorAll('.tab-pane');

      btns.forEach(b => b.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');

      const paneId = btn.getAttribute('data-tab');
      const targetPane = container.querySelector(`#${paneId}`);
      if (targetPane) {
        targetPane.classList.add('active');
      }
    });
  });

  // 7. Slide 12: Interactive Case Studies for Students (Hand-raising)
  const studentTabBtns = document.querySelectorAll('.student-tab-btn');
  const studentTabPanes = document.querySelectorAll('.student-tab-pane');

  studentTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const container = btn.closest('.student-case-widget');
      if (!container) return;

      const btns = container.querySelectorAll('.student-tab-btn');
      const panes = container.querySelectorAll('.student-tab-pane');

      btns.forEach(b => b.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');

      const paneId = btn.getAttribute('data-tab');
      const targetPane = container.querySelector(`#${paneId}`);
      if (targetPane) {
        targetPane.classList.add('active');
      }
    });
  });

  // 8. Interactive Quizzes Logic
  const quizContainers = document.querySelectorAll('.quiz-container');

  quizContainers.forEach(container => {
    const options = container.querySelectorAll('.quiz-option');
    const explanation = container.querySelector('.quiz-explanation');

    options.forEach(option => {
      option.addEventListener('click', () => {
        // 標記當前投影片或 Tab 頁面為已回答，以顯示說明內容
        const activeSlide = container.closest('.slide');
        if (activeSlide) {
          activeSlide.classList.add('quiz-answered');
        }
        const activeTabPane = container.closest('.student-tab-pane');
        if (activeTabPane) {
          activeTabPane.classList.add('quiz-answered');
        }

        // Reset option styling in this specific container
        options.forEach(opt => {
          opt.classList.remove('correct', 'incorrect');
        });

        const isCorrect = option.getAttribute('data-correct') === 'true';
        if (isCorrect) {
          option.classList.add('correct');
          if (explanation) {
            explanation.classList.add('show');
            explanation.style.background = '#ecfdf5';
            explanation.style.borderLeftColor = '#10b981';
            explanation.style.color = '#065f46';
            explanation.innerHTML = `<strong>✓ 回答正確！</strong><br>${explanation.getAttribute('data-text-correct')}`;
          }
        } else {
          option.classList.add('incorrect');
          if (explanation) {
            explanation.classList.add('show');
            explanation.style.background = '#fef2f2';
            explanation.style.borderLeftColor = '#ef4444';
            explanation.style.color = '#991b1b';
            explanation.innerHTML = `<strong>❌ 選項錯誤，請再試試！</strong><br>${explanation.getAttribute('data-text-incorrect') || '這不是最佳選項。'}`;
          }
        }
      });
    });
  });
});
