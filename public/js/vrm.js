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

    // clockの生成
    const clock = new THREE.Clock();
  
    // VRMの読み込み
    let currentvrm;
    const loader = new THREE.GLTFLoader()
    loader.load('./sample.vrm',
      (gltf) => {
        THREE.VRM.from(gltf).then( (vrm) => {
          // シーンへの追加
          scene.add(vrm.scene)

          // Three - ik
          const ikList = [new THREE.IK(), new THREE.IK()] // IKシステム
          const chainList = [new THREE.IKChain(), new THREE.IKChain()] // チェーン
          const pivotList = [];
          const bonesList = [];
          const nodesList = [];

          let boneName = [
            [THREE.VRMSchema.HumanoidBoneName.LeftUpperArm,
              THREE.VRMSchema.HumanoidBoneName.LeftLowerArm,
              THREE.VRMSchema.HumanoidBoneName.LeftHand],
            [THREE.VRMSchema.HumanoidBoneName.RightUpperArm,
             THREE.VRMSchema.HumanoidBoneName.RightLowerArm,
             THREE.VRMSchema.HumanoidBoneName.RightHand]]

          for (let j=0; j<2; j++){
            const movingTarget = new THREE.Mesh(
              new THREE.SphereGeometry(0.05),
              new THREE.MeshBasicMaterial({color: 0xff0000})
            )

            movingTarget.position.x = -0.2
            let pivot = new THREE.Object3D()
            pivot.add(movingTarget)
            pivot.position.x =  j == 0 ? -0.3 : 0.3
            pivot.position.y = 1.2
            pivot.position.z = -0.3
            scene.add(pivot)
            pivotList.push(pivot)

            const bones = [] // ボーン
            const nodes = [] // ノード
            for (let i = 0; i < 3; i++) {
              // ボーンとノードの生成
              const bone = new THREE.Bone()
              let node = vrm.humanoid.getBoneNode(boneName[j][i])
  
              if (i == 0) {
                node.getWorldPosition(bone.position)
              } else {
                bone.position.set(node.position.x, node.position.y, node.position.z)
                bones[i - 1].add(bone)
              }
              bones.push(bone)
              nodes.push(node)
  
              // チェーンに追加
              const target = i === 2 ? movingTarget : null
              chainList[j].add(new THREE.IKJoint(bone, {}), {target})
            }

            // IKシステムにチェーン追加
            ikList[j].add(chainList[j])

            // リストに追加
            bonesList.push(bones)
            nodesList.push(nodes)

            // ルートボーンの追加
            scene.add(ikList[j].getRootBone())

          }


          update(vrm, ikList, pivotList, bonesList, nodesList);
        })
      }
    )

    // update arm
    const updateArm = (bones, nodes, offset) => {

      const q = new THREE.Quaternion();
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), offset);
      nodes[0].setRotationFromQuaternion(bones[0].quaternion.multiply(q))
      nodes[1].setRotationFromQuaternion(bones[1].quaternion)
      nodes[2].setRotationFromQuaternion(bones[2].quaternion)

    }

    const update = (vrm, ikList, pivotList, bonesList, nodesList) => {
      // move target
      pivotList[0].rotation.z -= 0.01
      pivotList[1].rotation.z += 0.01

      // IKの更新
      ikList[0].solve()
      ikList[1].solve()

      // 腕の更新
      updateArm(bonesList[0], nodesList[0], Math.PI / 2)
      updateArm(bonesList[1], nodesList[1], -Math.PI / 2)


      // フレーム更新
      requestAnimationFrame(() => update(vrm, ikList, pivotList, bonesList, nodesList))
      renderer.render(scene, camera)

    }


    /*
    // blendshape
    // フレーム毎に呼ばれる
    const update = () => {
      requestAnimationFrame(update)
      renderer.render(scene, camera)

      if (currentvrm !== undefined){
        currentvrm.blendShapeProxy.setValue(THREE.VRMSchema.BlendShapePresetName.Joy, 1.0)
        // vrm.blendShapeProxy.setValue(VRMSchema.BlendShapePresetName.A, 0.95)
        // vrm.blendShapeProxy.setValue(VRMSchema.BlendShapePresetName.I, 0.85)

        const head = currentvrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.Head)
        head.rotation.y = Math.PI / 3;
        const leftlowerarm = currentvrm.humanoid.getBoneNode(THREE.VRMSchema.HumanoidBoneName.LeftLowerArm)
        leftlowerarm.rotation.z = Math.PI / 3;


        currentvrm.update(clock.getDelta())
      }

    }
    update()
    */
})