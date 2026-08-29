import './style.css'

document.addEventListener('DOMContentLoaded', () => {
  // --- Navbar Scroll Effect ---
  const navbar = document.getElementById('navbar');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // --- Mobile Menu Toggle ---
  const mobileBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  mobileBtn.addEventListener('click', () => {
    navLinks.classList.toggle('mobile-active');
  });

  // Close mobile menu when a link is clicked
  const links = document.querySelectorAll('.nav-links a');
  links.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('mobile-active');
    });
  });

  // --- Scroll Reveal Animations ---
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    const elementVisible = 150;

    revealElements.forEach(element => {
      const elementTop = element.getBoundingClientRect().top;

      if (elementTop < windowHeight - elementVisible) {
        element.classList.add('active');
      }
    });
  };

  // Trigger once on load
  revealOnScroll();

  // Trigger on scroll
  window.addEventListener('scroll', revealOnScroll);

  // --- AI Sales Agent (Chatbot) Logic ---
  const chatToggle = document.getElementById('chatbot-toggle');
  const chatContainer = document.getElementById('chatbot-container');
  const chatClose = document.getElementById('chatbot-close');
  const chatMessages = document.getElementById('chatbot-messages');
  const chatInput = document.getElementById('chatbot-input-field');
  const chatSendBtn = document.getElementById('chatbot-send-btn');
  const chatBadge = document.querySelector('.chatbot-badge');
  
  let chatState = 0;
  let leadData = { interesse: '', valor: '' };
  const waNumber = '5511999999999';

  // Toggle Chat
  const toggleChat = () => {
    chatContainer.classList.toggle('active');
    if (chatBadge) chatBadge.style.display = 'none';
    
    // Start flow if empty
    if (chatMessages.children.length === 0) {
      setTimeout(() => {
        addBotMessage('Olá! Sou o Especialista em IA da Gold Representações. Vi que você quer realizar um sonho ou alavancar seu patrimônio.');
        setTimeout(() => {
          addBotMessage('Qual o seu principal objetivo hoje?', [
            { text: 'Comprar Imóvel', value: 'Imóvel' },
            { text: 'Comprar Veículo', value: 'Veículo' },
            { text: 'Fazer Investimento', value: 'Investimento' }
          ]);
        }, 1000);
      }, 500);
    }
  };

  chatToggle.addEventListener('click', toggleChat);
  chatClose.addEventListener('click', () => chatContainer.classList.remove('active'));

  function addBotMessage(text, options = null) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg bot';
    msgDiv.textContent = text;
    
    if (options) {
      const optionsDiv = document.createElement('div');
      optionsDiv.className = 'chat-options';
      options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'chat-opt-btn';
        btn.textContent = opt.text;
        btn.onclick = () => handleUserSelection(opt.value, opt.text);
        optionsDiv.appendChild(btn);
      });
      msgDiv.appendChild(optionsDiv);
    }
    
    chatMessages.appendChild(msgDiv);
    scrollToBottom();
  }

  function addUserMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg user';
    msgDiv.textContent = text;
    chatMessages.appendChild(msgDiv);
    scrollToBottom();
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function handleUserSelection(value, text) {
    // Remove option buttons after selection
    const lastOptions = chatMessages.querySelector('.chat-options');
    if (lastOptions) lastOptions.remove();
    
    addUserMessage(text);
    leadData.interesse = value;
    chatState = 1;
    
    setTimeout(() => {
      addBotMessage(`Excelente escolha focar em ${value}! Qual seria o valor aproximado da carta de crédito que você precisa?`);
      chatInput.disabled = false;
      chatSendBtn.disabled = false;
      chatInput.focus();
    }, 1000);
  }

  function handleUserInput() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    addUserMessage(text);
    chatInput.value = '';
    chatInput.disabled = true;
    chatSendBtn.disabled = true;
    
    if (chatState === 1) {
      leadData.valor = text;
      
      setTimeout(() => {
        addBotMessage('Perfeito! Já entendi o que você precisa.');
        setTimeout(() => {
          addBotMessage('O especialista Anderson vai assumir agora pelo WhatsApp para finalizar sua simulação sem compromisso. Aguarde...');
          
          setTimeout(() => {
            const msg = `Olá Anderson! Falei com o assistente virtual no site. Tenho interesse em uma carta de crédito para *${leadData.interesse}* no valor aproximado de *${leadData.valor}*. Pode me ajudar?`;
            const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
            window.open(waUrl, '_blank');
          }, 2000);
          
        }, 1500);
      }, 1000);
    }
  }

  chatSendBtn.addEventListener('click', handleUserInput);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUserInput();
  });
});
