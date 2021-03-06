const express = require("express");
const User = require("../models/user");
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");
const {sendWelcomeEmail, sendCancelationEmail} = require("../emails/account");
const router = new express.Router();

router.post("/users", async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();  // bu kod yazılmayabilir. Çünkü zaten generateAuthToken() metodunda kaydetme işlemi bulunuyor
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();   // kullanıcı kaydolduktan sonra token veriliyor
        res.status(201).send({user, token});
    } catch (e) {
        res.status(400).send(e.message);
    }
})

router.post("/users/login", async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);   // eğer e-mail ve parola doğruysa sisteme giren kullanıcının bilgileri döndürülecek
        const token = await user.generateAuthToken();   // User değil user kullandık çünkü burada sadece oturum açan spesifik kullanıcıya token vereceğiz
        res.send({user, token});
    } catch (error) {
        res.status(400).send();
    }
})

router.post("/users/logout", auth, async (req, res) => {  // çıkış yapabilmek içinönce giriş yapılmadılır. Bu yüzden auth middleware fonksiyonu eklendi
    try {
        req.user.tokens = req.user.tokens.filter((tokens) => {   
            return tokens.token !== req.token;  // aradığımız token authentication için kullanılan token değilse bunu yeni bir arraye aktarır ve bu arrayi döner
        })
        await req.user.save();

        res.status(200).send();
    } catch (error) {
        res.status(500).send(error);
    }
})

router.post("/users/logoutAll", auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();

        res.status(200).send();
    } catch (error) {
        res.status(500).send(error);
    }
})

router.get("/users/me", auth, async (req, res) => { // önce middleware fonksiyonu olan auth çalışacak sonra async fonksiyon çalışacak
    res.send(req.user);
})

router.patch("/users/me", auth, async (req, res) => {

    const updates = Object.keys(req.body);  // güncellenen alanlar
    const allowedUpdates = ["name", "email", "password", "age"];    // güncellenebilecek alanlar (veri tabanındaki fieldlar)
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));    
    // eğer allowedUpdates içinde updates alanlarından biri yoksa false döner.

    if(!isValidOperation)
        return res.status(400).send("Error: Invalid update. Given field is not found");
    try {
        const user = await User.findOne(req.user);  // user, güncellenecek olan verinin tamamı (bir nesne)
        updates.forEach((update) => {   // updates güncelleyeceğimiz alanların isimleri; örn. name, email gibi
            user[update] = req.body[update];
        })
        await user.save();  // Middleware'in çalıştırılacağı yer

        // const user = await User.findByIdAndUpdate(_id, req.body, {new: true, runValidators: true});
        // findByIdAndUpdate metodu Mongoose'u atlayıp veritabanı ile direkt iletişime geçer

        if(!user){
            return res.status(404).send("User not found");
        }
        res.status(200).send(user);
    } catch (error) {
        res.status(400).send(error);
    }
})

router.delete("/users/me", auth, async (req, res) => {
    try {
        await req.user.remove();
        sendCancelationEmail(req.user.email, req.user.name);
        res.status(200).send(req.user);
    } catch (error) {
        res.status(500).send(error);
    }
})

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) { // yeni bir dosya yüklenmeye çalışıldığında çalışacak. req yapılan isteği, file yüklenen dosya ile ilgili bilgileri, cb ise dosyayı filtrelemeyi bitirdiğimizde Multer'a bildirmek için kullanılır
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){ // dosya uzantılarını belirlemek için regular expression kullandık (match fonksiyonunun da aldığı argüman) 
            return cb(new Error("Image type must be jpg, jpeg, or png"))
        }

        cb(undefined, true);
    }
})

// upload.single("avatarPic"), upload ile yukarıda oluşturulan değişken ismi aynı olmalı. upload=upload
router.post("/users/me/avatar", auth, upload.single("avatarPic"), async (req, res) => { // upload.single("upload"), middleware'e benzeyen bir yapı. içine aldığı parametre ise yükleme yapılırken belirtilecek isim (önemli)
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer();

    req.user.avatar = buffer;  // yukarıdaki upload nesnesindeki "dest" property'sini sildik. Bu yüzden verilen resimleri direkt bir dosyaya kaydetmek yerine onu veri tabanına aktarıyor. Eğer dest'i silmeseydik aşağıdaki satırlara bakmadan direkt verilen dosyaya kaydedecekti
    await req.user.save();
    res.send();
}, (error, req, res, next) => { // hata olduğunda yakalaycak bir diğer callback fonksiyonu. Express handling error
    res.status(400).send({error: error.message});   
})                                                  
// Yalnızca üç bağımsız değişkeniniz varsa, Express (req, res, next) => {} yaptığımızı düşünür, 
// dört bağımsız değişken kullanarak, Express'e bu ara yazılımın hataları işlediğini bildirmiş oluruz.

router.delete("/users/me/avatar", auth, async(req, res) => {
    if(!req.user.avatar){
        return res.status(400).send({message: "No Profile Picture Found!"})
    }

    try {
        req.user.avatar = undefined;
        await req.user.save();
        res.send({message: "Profile Picture Deleted Successfully"})
    } catch (error) {
        res.status(500).send({message: error});
    }
    
}, (error, req, res, next) => {
    res.status(400).send({error});   
})


router.get("/users/:id/avatar", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if(!user || !user.avatar){
            throw new Error();
        }

        res.set("Content-type", "image/png"); 
        // response headerları düzenleyebileceğimiz metod. Key-value olarak 2 argüman alır. ilk argüman response headerın ismi, diğeri ise value.

        res.send(user.avatar);

    } catch (error) {
        res.status(404).send({error});
    }
})

module.exports = router;