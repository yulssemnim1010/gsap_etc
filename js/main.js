//ScrollTrigger를 쓸 수 있게 GSAP에 먼저 등록한다
gsap.registerPlugin(ScrollTrigger);

// Lenis는 마우스휠 스크롤을 부드럽게 만들어 준다
// GSAP ScrollTrigger와 같이 쓰면 스크롤 애니메이션도 더 자연스럽게 붙는다
const lenis = new Lenis({
  //자동실행 대신 우리가 직접 프레임을 돌리게 한다
  autoRaf: false,
  //스크롤이 살짝 따라오는 시간을 정한다.
  duration: 0.8,
  //들어온 값을 그대로 써서 일정한 속도감을 만든다
  easing: (t) => t,
  //마우스 휠 스크롤을 부드럽게 만든다
  smoothWheel: true,
  //터치 스크롤도 lenis 흐름과 맞춘다
  syncTouch: true,
});

//매 프레임마다 lenis와 scrolltrigger를 같이 업데이트 해야 스크롤 애니메이션이 어긋나지 않음
function raf(time) {
  //지금 프레임의 시간을 lenis에게 알려준다
  lenis.raf(time);
  //ScrollTrigger가 현재 스크롤 위치를 다시 계산하게 한다.
  ScrollTrigger.update();
  //다음 화면 프레임에서도 같은일을 반복한다
  requestAnimationFrame(raf);
}
//브라우저 애니메이션 프레임 루프를 시작한다
requestAnimationFrame(raf);


const siteHeader = document.getElementById('site_header');
const menuToggle = document.getElementById('menu_toggle');
const mobilePanel = document.querySelector('.mobile_panel');
const navLinks = document.querySelectorAll('.primary_nav a, .mobile_nav a');
//직전 스크롤 위치를 저장해서 방향을 비교한다
let lastY = 0;

lenis.on('scroll', ({ scroll }) => {
  //해더가 없으면 더 진행하지 않는다
  if (!siteHeader) return;

  //lenis가 알려준 현재 스크롤 위치를 짧은 이름으로 담는다
  const y = scroll;

  //아래로 충분히 내렸고 첫 화면을 지난 상태면 헤더를 위로 숨긴다
  if (y > lastY + 4 && y > 120) {
    siteHeader.style.transform = 'translateY(-100%)'
  } else if (y < lastY - 4) {
    //원래 자리로 되돌린다
    siteHeader.style.transform = 'translateY(0)'
  }
  //다음 비교를 위해 현재 위치를 저장
  lastY = y;
  //스크롤이 움직였으니 현재 섹션 메뉴 표시도 다시 맞춘다
  updateActiveFromViewport();
});

//모바일 메뉴 버튼을 누르면 메뉴 패널이 열리고 닫힌다
if (menuToggle && mobilePanel) {
  menuToggle.addEventListener('click', () => {
    //is_open 클래스를 켜거나 끄고, 결과를 true/false로 받는다
    const isOpen = mobilePanel.classList.toggle('is_open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  })
}
// 메뉴 링크를 누른 뒤에는 모바일 메뉴를 닫아 화면을 다시 넓게 보여줌
function closeMobileMenu() {
  if (!menuToggle || !mobilePanel) return;
  mobilePanel.classList.remove('is_open');
  menuToggle.setAttribute('aria-expanded', 'false');
}
const sectionMap = [
  '#hero',
  '#projects',
  '#info',
  '#showcase',
  '#gallery',
  '#stats',
  '#contact',
];

//화면의 42% 지점에 가장 가까운 섹션을 현재 섹션으로 판단한다
//맨아래 근처에서는 contact 메뉴가 끝까지 active로 보이게 따로 처리한다
function updateActiveFromViewport() {
  //문서 맨 아래에 가까운지 확인
  const isNearBottom = window.screenY + window.innerHeight >= document.documentElement.scrollHeight - 80;
  //맨 아래라면 마지막 contact 메뉴를 켠다
  if (isNearBottom) {
    setActiveByHref('#contact');
    return;
  }
  //화면 위에서 42% 내려온 지점을 현재 섹션 판단 기준으로 쓴다
  const checkPoint = window.innerHeight * 0.42;
  //아직 못찾았을 때 기본 active는 hero로 둔다
  let activeHref = '#hero';
  //가장 가까운 섹션을 찾기 위해 큰 숫자로 시작한다
  let activeDistance = Infinity;

  //섹션 목록을 하나씩 돌면서 기준점과의 거리를 비교한다
  sectionMap.forEach((id) => {
    const section = document.querySelector(id);
    //섹션이 없으면 이번 항목은 건너뛴다
    if (!section) return;

    //화면 안에서 섹션의 현재 위치를 가져온다
    const rect = section.getBoundingClientRect();
    //기준점이 섹션안에 들어와 있는지 확인한다
    const isInside = rect.top <= checkPoint && rect.bottom >= checkPoint;
    //섹션 안이면 거리0, 밖이면 위/아래 경계중 더 가까운 거리로 계산한다
    const distance = isInside ? 0 : Math.min(Math.abs(rect.top - checkPoint), Math.abs(rect.bottom - checkPoint));

    //이번 섹션이 지금까지 본 섹션보다 기준점에 더 가까우면 교체
    if (distance < activeDistance) {
      //가장 가까운 거리 값을 갱신
      activeDistance = distance;
      //active로 켤 href도 이번 섹션 id로 바꾼다
      activeHref = id;
    }
    //최종으로 찾은 섹션을 메뉴 active 상태에 반영한다
    setActiveByHref(activeHref);
  });
}
//페이지가 처음 열렸을때는 hero메뉴를 active로 시작한다
setActiveByHref('#hero');

//지금 보고 있는 섹션의 메뉴만 노란 active 스타일이 켜지게 한다
//pc와 모바일 메뉴를 한번에 맞추려고 navLinks 전체를 돌린다
function setActiveByHref(href) {
  //모든 메뉴 링크를 하나씩 확인한다
  navLinks.forEach((link) => {
    //현재 링크의 href가 켜야할 섹션 href와 같은지 비교
    const isSameLink = link.getAttribute('href') === href;
    //같은 링크면 active를 켜고 아니면 끈다
    link.classList.toggle('is_active', isSameLink);
  })
}

//메뉴를 누르면 브라우저 기본 점프 이동을 막고 lenis로 부드럽게 이동
navLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    //브라우저 기본 앵커 점프를 막는다
    e.preventDefault();
    //클릭한 링크가 가리키는 섹션 id를 가져온다
    const targetId = link.getAttribute('href');
    const targetEl = document.querySelector(targetId);
    //모바일 메뉴가 열려 있었다면 먼저 닫는다
    closeMobileMenu();

    //이동할 섹션이 실제로 있으면 부드럽게 이동
    if (targetEl) {
      //lenis로 섹션까지 스크롤하고 헤더만큼 여백을 둔다
      lenis.scrollTo(targetEl, { offset: getScrollOffset() });
      //클릭 즉시 메뉴 active를 먼저 바꿔 체감 반응을 빠르게 만든다
      setActiveByHref(targetId);
    }
  })
});
// 고정 헤더가 섹션 제목을 덮지 않도록 도착 위치를 조금 위로 당긴다.
function getScrollOffset() {
  // 모바일은 헤더 높이가 작으니 offset도 조금 작게 준다.
  return window.innerWidth <= 640 ? -80 : -68;
}


//첫 화면의 제목, 설명 버튼을 순서대로 등장시킨다
gsap.timeline({ default: { duration: 0.8, ease: "power2.out", } })
  //제목을 제자리로 올리고 보이게 만든다
  .to('.hero_title', { y: 0, opacity: 1 })
  //설명 문장을 제목보다 살짝 늦게 따라오게 한다
  .to('.hero_sub', { y: 0, opacity: 1 }, '<0.12')
  //버튼도 같은 리듬으로 마지막에 등장
  .to('.hero_cta', { y: 0, opacity: 1 }, '<0.12')

//marquee는 같은 글자 줄을 여러개 복사해서 끝없이 흐르는 것처럼 보이게 한다
function marquee() {
  //marquee_wrap을 전부 찾아 각각 독립적으로 흐르게 만든다
  document.querySelectorAll('.marquee_wrap').forEach((wrap) => {
    const row = wrap.querySelector('.marquee_row');
    //기준 줄이 없으면 복사할 것도 없으니 건너 띈다
    if (!row) return;

    //한 줄의 실제 가로 길이를 기억한다
    const rowWidth = row.scrollWidth;

    //같은 줄을 여러개 복제해서 빈틈없이 이어 붙인다
    for (let i = 1; i < 10; i += 1) {
      //기준 줄을 복사해서 wrapper 안에 추가
      wrap.appendChild(row.cloneNode(true));
    }
    const rows = wrap.querySelectorAll('.marquee_row');
    //현재 가로 이동 위치를 저장
    let x = 0;

    //한 프레임마다 글자 줄을 조금씩 이동시키는 함수
    function step() {
      //reverse 클래스가 있으면 오른쪽, 없으면 왼쪽으로 움직임
      const dir = wrap.classList.contains('reverse') ? 1 : -1;
      //방향에 맞춰 현재 위치를 1px씩 움직임
      x += dir;

      //모든 복제 줄의 위치를 각각 다시 계산
      rows.forEach((item, index) => {
        //현재 줄은 기본 위치에 자기 순서만큼 rowWidth를 더해 배치
        let offset = x + index * rowWidth;

        //왼쪽으로 나가서 완전히 사라진 줄은 맨 오른쪽 뒤로 보낸다
        if (dir === -1 & offset <= -rowWidth) {
          offset += rowWidth * rows.length;
          //오른쪽으로 나가서 완전히 사라진 줄은 맨 왼쪽 앞으로 보낸다
        } else if (dir === 1 & offset >= rowWidth) {
          offset -= rowWidth * rows.length;
        }

        //계산한 위치를 실제 화면 이동으로 적용
        item.style.transform = `translateX(${offset}px)`;
      });

      //다음 프레임에서도 계속 움직이게 예약
      requestAnimationFrame(step);
    }

    //이 marquee 줄의 애니메이션을 시작
    requestAnimationFrame(step);
  });
}

//페이지에 있는 marquee들을 실제로 실행
marquee();

//프로젝트 카드가 화면에 들어오면 아래에서 위로 나타난다
gsap.to('.feature_card', {
  y: 0,
  opacity: 1,
  duration: 0.6,
  ease: "power2.out",
  stagger: 0.22,
  scrollTrigger: {
    trigger: '.feature_list',
    start: 'top 55%',
    // - onEnter, onLeave, onEnterBack, and onLeaveBack
    //내려갈때 재생, 위로 벗어나면 다시 되감기
    toggleActions: "play reverse play reverse",
  }
});

//문장을 단어 단위 span으로 쪼갠다
//이렇게 해야 단어마다 시간차 애니메이션을 줄 수 있다
function splitWords(selector, wordClass) {
  //selector에 맞는 텍스트 요소들을 모두 찾는다
  document.querySelectorAll(selector).forEach((textEl) => {
    //textEl 요소 안의 텍스트를 가져와 앞뒤 공백을 제거한뒤에 공백 기준으로 나누어 배열로 만드는 코드
    const words = textEl.textContent.trim().split(/\s+/);
    textEl.innerHTML = words.map((word) => `<span class="${wordClass}">${word}</span>`).join(' ')
  })
}

//카드 제목의 strong 영역을 하나씩 처리
document.querySelectorAll('.feature_card h3 strong').forEach((titEl) => {
  const lines = titEl.querySelectorAll('.title_line');
  lines.forEach((line) => {
    const words = line.textContent.trim().split(/\s+/);
    line.innerHTML = words.map((word) => `<span class="word">${word}</span>`).join(' ')
  });
});
//설명문장도 motion_word단어 span으로 나눔
splitWords('.mtauto .motion_phrase', 'motion_word');

//카드 큰 제목은 단어가 하나씩 차례로 등장
gsap.from('.feature_card .word', {
  y: 22,
  opacity: 0,
  ease: "power2.out",
  stagger: 0.08,
  duration: 0.8,
  scrollTrigger: {
    trigger: '.feature_list',
    start: 'top 55%',
    // - onEnter, onLeave, onEnterBack, and onLeaveBack
    //내려갈때 재생, 위로 벗어나면 다시 되감기
    toggleActions: "play reverse play reverse",
  }
});

//카드 설명 문장도 단어 단위로 살짝 늦게 따라오게 만든다
gsap.from('.feature_card .motion_word', {
  y: 18,
  opacity: 0,
  ease: "power2.out",
  stagger: 0.035,
  duration: 0.7,
  scrollTrigger: {
    trigger: '.feature_list',
    start: 'top 55%',
    // - onEnter, onLeave, onEnterBack, and onLeaveBack
    //내려갈때 재생, 위로 벗어나면 다시 되감기
    toggleActions: "play reverse play reverse",
  }
});

//카드 위에 마우스를 올리면 빛이 따라다니는 것처럼 보이는 레이어를 만든다
document.querySelectorAll('.feature_card').forEach((card) => {
  const glass = document.createElement('div');
  glass.className = 'glass_reflect';
  card.appendChild(glass);

  //카드 위에서 마우스가 움직일때마다 빛 위치를 바꾼다
  card.addEventListener('mousemove', (e) => {
    //카드의 화면 위치와 크기를 가져온다
    const rect = card.getBoundingClientRect();
    //마우스 x좌표를 카드 안쪽 기준으로 바꾼다
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // 마우스 위치를 중심으로 노란 빛이 퍼지는 배경을 만든다.
    glass.style.background = `
      radial-gradient(
        circle at ${x}px ${y}px,
        rgba(240,222,68, 0.2),
        rgba(196,196,68, 0) 30%
      )
    `;
  });

  card.addEventListener('mouseleave', () => {
    glass.style.background = 'transparent';
  })
});

//카드 안쪽 레이어를 마우스 위치에 맞춰 살짝 기울인다
//rotateX rotateY만 바꾸기
document.querySelectorAll('.tit_card').forEach((card) => {
  const layer = card.querySelector('.tit_layer');
  //레이어가 없으면 이 카드는 건너뛴다
  if (!layer) return;

  //카드 위에서 마우스를 움직일때 기울기 값을 계산
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    //카드안에서 마우스가 가로로 몇퍼센트 위치인지 계산
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    //위아래 위치를 rotateX 각도로 바꾼다
    const rx = (py - 0.5) * -15;
    const ry = (px - 0.5) * 22;

    //계산한 각도를 안쪽 레이어 transform에 적용
    layer.style.transform = `translateZ(0) rotateX(${rx}deg) rotateY(${ry}deg)`;

    card.addEventListener('mouseleave', () => {
      layer.style.transform = `translateZ(0) rotateX(0deg) rotateY(0deg)`;
    })
  })
});


const stickyBox = document.querySelector('.sticky_box');
const processCards = gsap.utils.toArray('.projects_all .card');

processCards.forEach((card, index) => {
  //카드 순서에 맞는 이미지 파일 경로를 만든다
  const imgUrl = `asset/info${index + 1}.png`;

  //카드가 화면 중앙에 들어오는 순간 감지
  ScrollTrigger.create({
    trigger: card,
    start: 'top center',
    end: 'bottom center',
    onEnter: () => changeBg(imgUrl),
    onEnterBack: () => changeBg(imgUrl),
  });
})

//sticky 박스의 이미지를 바로 바꾸면 딱닥해서 살짝 줄였다가 다시 키우며 교체
function changeBg(imgUrl) {
  if (!stickyBox) return;

  gsap.to(stickyBox, {
    opacity: 0.72,
    scale: 0.98,
    duration: 0.2,
    onComplete: () => {
      stickyBox.style.backgroundImage = `url(${imgUrl})`;
      gsap.to(stickyBox, { opacity: 1, scale: 1, duration: 0.45 });
    }
  })
}
//처음 화면에 들어오기 전 기본 sticky 이미지를 1번으로 세팅
changeBg(`asset/info1.png`);

const pinBg = document.getElementById('pin_bg');
const photos = gsap.utils.toArray('.photo');

//showcase 섹션은 화면을 고정한 상태에서 사진들이 차례대로 올라온다
const pinTl = gsap.timeline({
  scrollTrigger: {
    trigger: '.pin_scene',
    start: 'top top',
    //1800px 스크롤 하는 동안 타임라인이 진행된다
    end: '+=1800',
    //섹션을 화면에 고정해서 사진이 올라오는 무대를 만든다
    pin: true,
    // 스크롤 위치와 애니메이션 진행도를 연결
    scrub: true,
    // pin이 시작될 때 생길 수 있는 튐을 줄인다.
    anticipatePin: 1,
    // 새로고침이나 리사이즈 때 값을 다시 계산한다.
    invalidateOnRefresh: true,
    // 내려갈 때만 재생하고, 다시 위에서 진입하면 초기화한다.
    toggleActions: 'play none none reset',
  }
});

//배경 이미지를 살짝 흐리고 키워서 뒤로 밀리는 느낌을 만든다
pinTl.to(pinBg, { filter: 'blur(12px', scale: 1.06, duration: 1, ease: 'none' }, 0);

//사진마다 살짝 다른 각도와 giltch 효과를 줘서 디자인 갤러리 처럼 겹쳐 보이게 한다
photos.forEach((photo, index) => {
  //사진이 등장하기 직전에 레이어 순서와 giltch클래스를 조정
  pinTl.add(() => {
    //뒤에 나온 사진이 앞쪽에 쌓이도록 z-index 올림
    photo.style.zIndex = String(100 + index);
    photo.classList.add('glitch');
    //0.4초 뒤 glitch 클래스를 제거해 효과를 끝낸다
    gsap.delayedCall(0.4, () => photo.classList.remove('glitch'));
  }, index * 0.22);

  //사진을 숨겨진 시작 상태에서 보이는 상태로 이동시킨다
  pinTl.fromTo(photo, {
    opacity: 0,
    y: 1080,
    scale: 0.4,
    filter: 'blur(6px)',
    rotate: (index % 2) ? 4 : -4,
  }, {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    rotate: (index % 2) ? 5 : -5,
    duration: 0.85,
    //빠르게 올라온 뒤 부드럽게 멈추게 한다
    ease: 'power3.out',
  }, index * 0.22)
});

// 사진 묶음 전체를 마지막에 조금 위로 올려 장면이 마무리되는 느낌을 준다.
pinTl.to('.float_wrap', { yPercent: -6, duration: 0.8, ease: 'none' }, '>0.1');

//가로 스크롤 섹션에서 실제로 옆으로 움직여야 되는 거리를 계산
//track 전체 너비에서 화면에 이미 보이는 너비를 빼면 이동 거리만 남음
function totalWidth() {
  const wrap = document.querySelector('.horizontal_section');
  const track = document.querySelector('.track');
  // 필요한 요소가 없으면 이동 거리도 0으로 처리한다.
  if (!wrap || !track) return 0;

  // 전체 트랙 너비에서 현재 화면에 보이는 너비를 빼서 이동할 거리만 남긴다.
  return Math.max(0, track.scrollWidth - wrap.clientWidth);
}

//horizontal_section은 세로 스크롤을 가로 이동으로 바궈 보여줌
const horizontalTween = gsap.to('.track', {
  //트랙을 왼쪽으로 이동시켜 오른쪽 카드들이 보이게 한다
  x: () => -totalWidth(),
  ease: 'none',
  scrollTrigger: {
    trigger: '.horizontal_section',
    start: 'top top',
    //실제 이동 거리보다 더 길게 잡아 앞뒤 여백 스크롤을 만든다
    end: () => '+=' + (totalWidth() + window.innerWidth * 1.45),
    scrub: true,
    pin: true,
    // pin 시작 튐을 줄인다.
    anticipatePin: 1,
    // 리사이즈 때 이동 거리를 다시 계산한다.
    invalidateOnRefresh: true,
    // 내려갈 때만 진행하고 역방향 상태는 scrub이 처리한다.
    toggleActions: 'play none none reset',
  }
});

// 케이스 이미지가 모두 같은 방식으로 나오면 지루해서, 여러 등장 방식을 돌려쓴다.
const imageMotionPresets = [
  {
    x: 0,
    y: 96,
    scale: 0.86,
    rotate: -8,
    filter: 'blur(10px)',
    duration: 0.9,
    ease: 'power3.out',
  },
  {
    x: 120,
    y: 34,
    scale: 0.92,
    rotate: 9,
    filter: 'blur(8px)',
    duration: 1,
    ease: 'back.out(1.25)',
  },
  {
    x: -96,
    y: 70,
    scale: 1.08,
    rotate: -12,
    filter: 'blur(12px)',
    duration: 0.95,
    ease: 'power2.out',
  },
  {
    x: 24,
    y: -76,
    scale: 0.9,
    rotate: 11,
    filter: 'blur(14px)',
    duration: 1.05,
    ease: 'expo.out',
  },
];
const imageMotionOffset = Math.floor(Math.random() * imageMotionPresets.length);


//각 case_panel 안에서 텍스트는 순서대로, 이미지는 서로 다른 방향에서 등장
document.querySelectorAll('.case_panel').forEach((article, articleIndex) => {
  const copyItems = article.querySelectorAll('.case_kicker,.case_copy h2,.case_copy p,.case_meta li');
  const caseImages = article.querySelectorAll('.case_image');
  //텍스트 요소들을 아래에서 위로 순서대로 등장 시킨다
  gsap.fromTo(copyItems, {
    y: 36,
    opacity: 0,
  }, {
    y: 0,
    opacity: 1,
    stagger: 0.08,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: {
      // 현재 아티클을 기준으로 등장 타이밍을 잡는다.
      trigger: article,
      // 가로 스크롤 애니메이션 안에서 위치를 계산한다.
      containerAnimation: horizontalTween,
      // 패널 왼쪽이 화면 70% 지점에 오면 시작한다.
      start: 'left 70%',
      // 다시 왼쪽으로 벗어나면 되감기만 한다.
      toggleActions: 'play none none reverse',
    },
  })

  //패널안의 이미지들을 하나씩 다른 preset으로 등장
  caseImages.forEach((caseImage, imageIndex) => {
    // 랜덤 시작점과 패널/이미지 순서를 섞어 사용할 preset 번호를 만든다.
    const presetIndex = (imageMotionOffset + articleIndex + imageIndex) % imageMotionPresets.length;
    // 실제로 적용할 모션 preset을 꺼낸다.
    const preset = imageMotionPresets[presetIndex];
    // CSS에 이미 잡힌 기본 회전값을 읽어둔다.
    const baseRotate = parseFloat(gsap.getProperty(caseImage, 'rotate')) || 0;
    gsap.fromTo(caseImage, {
      x: preset.x,
      y: preset.y,
      opacity: 0,
      scale: preset.scale,
      rotate: baseRotate + preset.rotate,
      filter: preset.filter,
    }, {
      // 최종 x 위치는 원래 자리다.
      x: 0,
      // 최종 y 위치는 원래 자리다.
      y: 0,
      // 최종 상태는 완전히 보이게 한다.
      opacity: 1,
      // 최종 크기는 원래 크기다.
      scale: 1,
      // 최종 회전은 CSS 기본 회전값으로 돌아간다.
      rotate: baseRotate,
      // 최종 상태에서는 blur를 지운다.
      filter: 'blur(0px)',
      // 같은 패널 안에서도 이미지마다 조금씩 늦게 나온다.
      delay: imageIndex * 0.08,
      // preset마다 다른 등장 시간을 사용한다.
      duration: preset.duration,
      // preset마다 다른 easing을 사용한다.
      ease: preset.ease,
      scrollTrigger: {
        // 현재 패널을 기준으로 이미지 등장 타이밍을 잡는다.
        trigger: article,
        // 가로 스크롤 애니메이션 안에서 위치를 계산한다.
        containerAnimation: horizontalTween,
        // 이미지 순서가 뒤로 갈수록 조금 더 늦게 시작한다.
        start: `left ${70 - imageIndex * 6}%`,
        // 뒤로 스크롤하면 이미지를 다시 숨긴다.
        toggleActions: 'play none none reverse',
      },
    })

  })
})