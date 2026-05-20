import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/all'

function createPacket(
  width: number,
  height: number,
  fill: string,
  className: string
): SVGRectElement {
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
  rect.setAttribute("width", width.toString())
  rect.setAttribute("height", height.toString())
  rect.setAttribute("rx", (height / 2).toString())
  rect.setAttribute("x", (-width / 2).toString())
  rect.setAttribute("y", (-height / 2).toString())
  rect.setAttribute("fill", fill)
  rect.setAttribute("class", className)
  return rect
}

export function useScrollAnimations(
  activePath: SVGPathElement,
  group: SVGGElement,
  totalHeight: number
) {
  // SVGの内部高さとウィンドウ高さの差分（カメラの移動範囲）
  const maxScrollY = totalHeight - window.innerHeight

  // 1. メインパス描画アニメーション
  gsap.to(activePath, {
    strokeDashoffset: 0,
    ease: "none",
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: `+=${maxScrollY}`,
      scrub: 0.5
    }
  })

  // 2. カメラ移動（SVG Group のY軸移動）
  // スクロールに応じてSVGグループを上に移動させることで、
  // 回路図の下の方が見えるようになる
  gsap.to(group, {
    y: -maxScrollY,
    ease: "none",
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: `+=${maxScrollY}`,
      scrub: 0
    }
  })

  // 3. メインパケット（スクロール連動）
  const myPacket = createPacket(30, 4, "#ff9900", "packet-glow-main")
  myPacket.id = "my-packet"
  group.appendChild(myPacket)

  const packetTween = gsap.to(myPacket, {
    motionPath: {
      path: activePath,
      align: activePath,
      alignOrigin: [0.5, 0.5],
      autoRotate: true,
      start: 0,
      end: 1
    },
    ease: "none",
    paused: true
  })

  ScrollTrigger.create({
    trigger: "body",
    start: "top top",
    end: `+=${maxScrollY}`,
    scrub: 0.1,
    onUpdate: (self) => {
      packetTween.progress(self.progress)
    }
  })

  // 4. サブパケット（自動ループアニメーション）
  const subPaths = Array.from(document.querySelectorAll('.circuit-path-sub'))
  subPaths.forEach((pathEl) => {
    const pkt = createPacket(20, 3, "#005577", "packet-glow-sub")
    group.appendChild(pkt)

    gsap.to(pkt, {
      motionPath: {
        path: pathEl,
        align: pathEl,
        alignOrigin: [0.5, 0.5],
        autoRotate: true,
        start: 0,
        end: 1
      },
      duration: 10 + Math.random() * 5,
      repeat: -1,
      ease: "linear",
      opacity: 0.8
    })
  })
}
