window.addEventListener("DOMContentLoaded", () => {
    // canvasの取得
    const canvas = document.getElementById('canvas')
  
    // シーンの生成
    const scene = new THREE.Scene()
  
    // カメラの生成
    const camera = new THREE.PerspectiveCamera(
      45, canvas.clientWidth/canvas.clientHeight, 0.1, 1000)
    camera.position.set(0, 1.3, -1)
    camera.rotation.set(0, Math.PI, 0)
  
    // レンダラーの生成
    const renderer = new THREE.WebGLRenderer()
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)
    renderer.setClearColor(0x7fbfff, 1.0)
    canvas.appendChild(renderer.domElement)
  
    // ライトの生成
    const light = new THREE.DirectionalLight(0xffffff)
    light.position.set(-1, 1, -1).normalize()
    scene.add(light)
  
    // VRMの読み込み
    let mixer
    const loader = new THREE.GLTFLoader()
    loader.load('./sample.vrm',
      (gltf) => {
        THREE.VRM.from(gltf).then((vrm) => {
          // シーンへの追加
          scene.add(vrm.scene)
         
          // アニメーションの設定
          setupAnimation(vrm)
        })
      }
    )
   
    // アニメーションの設定
    const setupAnimation = (vrm) => {
      // ボーンリストの生成
      const bones = [
        THREE.VRMSchema.HumanoidBoneName.Head
      ].map((boneName) => {
        return vrm.humanoid.getBoneNode(boneName)
      })
       
      // AnimationClipの生成
      const clip = THREE.AnimationClip.parseAnimation({
        hierarchy: [
          {
            keys: [
              {
                rot: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)).toArray(),
                time: 0                       
              },
              {
                rot: new THREE.Quaternion().setFromEuler(new THREE.Euler(-40*Math.PI/180, 0, 0)).toArray(),
                time: 1000                        
              },
              {
                rot: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)).toArray(),
                time: 2000                        
              }
            ]
          }
        ]
      }, bones)
     
      // トラック名の変更
      clip.tracks.some((track) => {
        track.name = track.name.replace(/^\.bones\[([^\]]+)\].(position|quaternion|scale)$/, '$1.$2')
      })
     
      // AnimationMixerの生成
      mixer = new THREE.AnimationMixer(vrm.scene)
      
      // AnimationActionの生成とアニメーションの再生
      let action = mixer.clipAction(clip)
      action.play()
    }
  
    // 最終更新時間
    let lastTime = (new Date()).getTime()
   
    // フレーム毎に呼ばれる
    const update = () => {
      requestAnimationFrame(update)
     
      // 時間計測
      let time = (new Date()).getTime()
      let delta = time - lastTime;
  
      // AnimationMixerの定期処理
      if (mixer) {
        mixer.update(delta)
      }
  
      // 最終更新時間
      lastTime = time;
  
      // レンダリング
      renderer.render(scene, camera)
    }
    update()
  })
  