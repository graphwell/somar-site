document.addEventListener('DOMContentLoaded', () => {

    // 1. Hero Subtitle Rotation
    const subtitles = [
        "Automatize seu atendimento com IA",
        "Reduza custos e escale seu negócio",
        "Tecnologia sob medida para sua empresa",
        "Do diagnóstico ao resultado. Em dias, não em meses."
    ];
    let subtitleIndex = 0;
    const subtitleElement = document.getElementById('hero-subtitle');

    if (subtitleElement) {
        setInterval(() => {
            subtitleElement.style.opacity = 0;
            subtitleElement.style.transform = 'translateY(20px)';
            setTimeout(() => {
                subtitleIndex = (subtitleIndex + 1) % subtitles.length;
                subtitleElement.textContent = subtitles[subtitleIndex];
                subtitleElement.style.opacity = 1;
                subtitleElement.style.transform = 'translateY(0)';
            }, 600);
        }, 3000);
    }

    // 2. Animated Numbers
    const countUp = (element) => {
        const target = parseInt(element.getAttribute('data-target'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;
        const update = () => {
            current += step;
            if (current < target) {
                element.textContent = Math.floor(current) + (element.getAttribute('data-suffix') || '');
                requestAnimationFrame(update);
            } else {
                element.textContent = target + (element.getAttribute('data-suffix') || '');
            }
        };
        update();
    };

    const numbersObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.querySelectorAll('.count').forEach(countUp);
                numbersObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const numbersSection = document.querySelector('.numbers-section');
    if (numbersSection) numbersObserver.observe(numbersSection);

    // 3. FAQ Accordion
    document.querySelectorAll('.faq-item').forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
            if (!isActive) item.classList.add('active');
        });
    });

    // 4. Scroll Reveal
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // 5. Mobile Menu Toggle
    const burger = document.getElementById('burger-menu');
    const navLinks = document.querySelector('.nav-links');

    if (burger) {
        burger.addEventListener('click', () => {
            burger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                burger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // 6. DIAGNÓSTICO IA — Quiz Interativo
    const quizAnswers = {};
    const progressBar = document.getElementById('quiz-progress');

    // Matriz de soluções: Desafio × Setor
    const solutionMap = {
        atendimento: {
            clinica:   { solucao: '🏥 IA para Clínicas + WhatsApp Inteligente', detalhe: 'Agendamento automático, confirmação de consultas e atendimento 24h. Elimine listas de espera e reduza faltas com lembretes por IA.' },
            comercio:  { solucao: '💬 Chatbot WhatsApp com IA para E-commerce', detalhe: 'Atendimento automatizado, rastreamento de pedidos e catálogo inteligente — sem contratar equipe extra.' },
            servicos:  { solucao: '🤖 Agente de IA Personalizado para Serviços', detalhe: 'Um atendente virtual que qualifica clientes, agenda reuniões e responde dúvidas com o tom da sua marca.' },
            industria: { solucao: '⚙️ Automação de Atendimento Corporativo', detalhe: 'Integração entre CRM, ERP e IA para centralizar e automatizar todo o fluxo de atendimento B2B.' },
        },
        vendas: {
            clinica:   { solucao: '📈 Funil de Conversão com IA para Clínicas', detalhe: 'Captação de leads, qualificação automática e agendamento inteligente para aumentar sua taxa de conversão.' },
            comercio:  { solucao: '🛒 IA de Vendas para E-commerce', detalhe: 'Chatbot de vendas ativo que envia ofertas, recupera carrinhos e converte leads no WhatsApp automaticamente.' },
            servicos:  { solucao: '🎯 Automação de Follow-up e Prospecção com IA', detalhe: 'Sequências automáticas de mensagens personalizadas para nutrir leads e fechar mais negócios sem esforço manual.' },
            industria: { solucao: '📊 MarketLens — Inteligência de Mercado', detalhe: 'Transforme seus dados de vendas e estoque em decisões estratégicas com dashboards inteligentes em tempo real.' },
        },
        processos: {
            clinica:   { solucao: '🔄 Automação de Processos para Clínicas', detalhe: 'Prontuário digital, lembretes automáticos, confirmação de consultas e relatórios médicos integrados com IA.' },
            comercio:  { solucao: '⚙️ Automação Operacional para Comércio', detalhe: 'Integração entre estoque, pedidos, pagamentos e logística em um fluxo automático sem intervenção manual.' },
            servicos:  { solucao: '💻 Sistema Personalizado sob Medida', detalhe: 'Desenvolvemos o software que a sua operação precisa — do zero — para eliminar retrabalho e ganhar eficiência.' },
            industria: { solucao: '🏭 Automação Industrial e de Processos', detalhe: 'Integramos sistemas legados, criamos dashboards de controle e automatizamos fluxos complexos com IA e APIs.' },
        },
        dados: {
            clinica:   { solucao: '📊 Dashboard de Inteligência para Clínicas', detalhe: 'Visualize ocupação de agenda, taxa de retorno, receita e performance por médico em um painel completo de IA.' },
            comercio:  { solucao: '📈 MarketLens — IA para Decisões de Negócio', detalhe: 'Análise automática de vendas, estoque e lucratividade. Pare de tomar decisões no escuro.' },
            servicos:  { solucao: '🎯 Consultoria em IA e Estratégia de Dados', detalhe: 'Mapeamos seus dados, identificamos oportunidades e implementamos soluções de BI com inteligência artificial.' },
            industria: { solucao: '🏭 Business Intelligence Industrial com IA', detalhe: 'Dashboards operacionais, previsão de demanda e análise de desempenho integrada aos seus sistemas de gestão.' },
        },
    };

    const whatsappMessages = {
        chatbot:    'Olá! Fiz o diagnóstico no site e tenho interesse em implementar um chatbot com IA no WhatsApp.',
        sistema:    'Olá! Fiz o diagnóstico no site e tenho interesse em desenvolver um sistema ou plataforma web personalizada.',
        automacao:  'Olá! Fiz o diagnóstico no site e tenho interesse em automatizar processos e integrar fluxos com IA.',
        estrategia: 'Olá! Fiz o diagnóstico no site e gostaria de uma consultoria estratégica de IA para minha empresa.',
    };

    function setProgress(step) {
        if (!progressBar) return;
        const pct = step === 'resultado' ? 100 : ((step / 3) * 100);
        progressBar.style.width = pct + '%';
    }

    function goToStep(stepId) {
        document.querySelectorAll('.quiz-step').forEach(s => s.classList.remove('active'));
        const target = document.getElementById(stepId);
        if (target) target.classList.add('active');
    }

    function showResult() {
        const desafio  = quizAnswers[1] || 'atendimento';
        const setor    = quizAnswers[2] || 'servicos';
        const objetivo = quizAnswers[3] || 'chatbot';

        const solution = (solutionMap[desafio] && solutionMap[desafio][setor])
            ? solutionMap[desafio][setor]
            : { solucao: '🚀 Solução Personalizada Somar.IA', detalhe: 'A Somar.IA vai mapear seu negócio e propor a solução ideal em IA, configurada do zero para você.' };

        document.getElementById('resultado-solucao').textContent = solution.solucao;
        document.getElementById('resultado-detalhe').textContent = solution.detalhe;

        const baseMsg = whatsappMessages[objetivo] || 'Olá! Fiz o diagnóstico no site e quero saber mais sobre as soluções da Somar.IA.';
        const nomeSolucao = solution.solucao.replace(/^\S+\s/, ''); // remove emoji
        const mensagem = encodeURIComponent(`${baseMsg} Solução identificada: ${nomeSolucao}.`);
        document.getElementById('resultado-cta').href = `https://wa.me/5511925203237?text=${mensagem}`;

        setProgress('resultado');
        goToStep('step-resultado');
    }

    // Event delegation nos botões do quiz
    const quizContainer = document.getElementById('quiz-container');
    if (quizContainer) {
        quizContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.quiz-option');
            if (!btn) return;

            const step  = parseInt(btn.getAttribute('data-step'));
            const value = btn.getAttribute('data-value');
            quizAnswers[step] = value;

            // Feedback visual
            btn.closest('.quiz-options').querySelectorAll('.quiz-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            setProgress(step);

            // Avança para o próximo passo com animação
            setTimeout(() => {
                if (step < 3) {
                    goToStep(`step-${step + 1}`);
                } else {
                    showResult();
                }
            }, 380);
        });
    }

    // Reiniciar quiz
    const btnReiniciar = document.getElementById('btn-reiniciar');
    if (btnReiniciar) {
        btnReiniciar.addEventListener('click', () => {
            Object.keys(quizAnswers).forEach(k => delete quizAnswers[k]);
            document.querySelectorAll('.quiz-option').forEach(b => b.classList.remove('selected'));
            setProgress(0);
            goToStep('step-1');
        });
    }

});
