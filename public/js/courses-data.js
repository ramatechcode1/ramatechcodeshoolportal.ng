const COURSES = [
  {
    num: '01',
    title: 'Coding Fundamentals',
    desc: 'Programming logic, algorithms, flowcharts, variables, loops and debugging — the foundation for everything else.',
    tags: ['Logic', 'Algorithms', 'Debugging']
  },
  {
    num: '02',
    title: 'Python Programming',
    desc: 'From variables to object-oriented programming, building a calculator, quiz app, and student result system.',
    tags: ['Python', 'OOP', 'Projects']
  },
  {
    num: '03',
    title: 'Website Development',
    desc: 'HTML, CSS, JavaScript and responsive design — students launch a personal portfolio and a school website.',
    tags: ['HTML', 'CSS', 'JavaScript']
  },
  {
    num: '04',
    title: 'Mobile App Development',
    desc: 'Building Android apps — an attendance app, a calculator, a chat app, a small business app.',
    tags: ['Android', 'Apps']
  },
  {
    num: '05',
    title: 'Game Development',
    desc: 'Puzzle, racing, educational and adventure games — learning logic through play, then building it.',
    tags: ['Games', 'Design']
  },
  {
    num: '06',
    title: 'Robotics Engineering',
    desc: 'Robot design, sensors, motors and automation — obstacle-avoidance, line-following and Bluetooth robots.',
    tags: ['Robots', 'Sensors', 'Automation']
  },
  {
    num: '07',
    title: 'Electronics & Microcontrollers',
    desc: 'Circuits, breadboards, Arduino and ESP32 — a smart door lock, digital thermometer, motion detector.',
    tags: ['Arduino', 'ESP32', 'Circuits']
  },
  {
    num: '08',
    title: 'Smart Home Technology',
    desc: 'How modern homes automate — smart fans, lighting, security and irrigation systems, built by hand.',
    tags: ['IoT', 'Automation']
  },
  {
    num: '09',
    title: 'Artificial Intelligence',
    desc: 'AI fundamentals, machine learning concepts, chatbots, image recognition and voice assistants.',
    tags: ['AI', 'ML', 'Chatbots']
  },
  {
    num: '10',
    title: 'Internet of Things (IoT)',
    desc: 'How devices talk to each other — smart farming, remote monitoring and connected sensors.',
    tags: ['IoT', 'Sensors']
  },
  {
    num: '11',
    title: 'Cybersecurity Awareness',
    desc: 'Safe internet usage, password protection, online privacy and digital ethics for young learners.',
    tags: ['Safety', 'Privacy']
  }
];

function renderCourses() {
  const grid = document.getElementById('courseGrid');
  if (!grid) return;
  grid.innerHTML = COURSES.map(c => `
    <div class="course-card">
      <div class="card-num">MODULE ${c.num}</div>
      <h3>${c.title}</h3>
      <p>${c.desc}</p>
      <div class="course-tags">${c.tags.map(t => `<span>${t}</span>`).join('')}</div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', renderCourses);
