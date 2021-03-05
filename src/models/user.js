const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./task");

/* mongoose.Schema metoduyla birlikte önceden mongoose.model() metodunun 2. parametresi olarak verdiğimiz ve veritabanında collection  
oluşturmak için kullandığımız nesneleri burada mongoose.Schema() metoduna parametre olarak veriyoruz. Bu sayede middleware olarak 
bilinen xc şeyden faydalanabiliriz. Middleware herhangi birşey yapmadan (örn. veri kaydetme) önce veya sonra yapılacak iş olarak
tanımlanabilir. 
*/
const userSchema = new mongoose.Schema({   // task-manager veri tabanında bulunan "users" collection'ınına document eklemek 
    name: {                                // için bir nevi constructor (model denebilir) oluşturduk
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowerCase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Email is invalid");
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value){    // custom validation; kendi oluşturduğumuz kontrol yapısı
            if (value < 0) {
                throw new Error("Age must be greater than zero");
            }
        }
    },
    password: {
        type: String,
        required: true,
        minLength: 6,
        trim: true,
        validate(value){
            if(value.toLowerCase().includes("password")){
                throw new Error("Password can not contain -password-")
            }
        }
    },
    tokens: [{  // kullanıcıya verilen tokenları takip etmek için. Yani kullanıcı birden fazla yerde oturum açtığında,
        token: {  // örneğin hem telefonda hem laptopda, ona yeni bir token verilmelidir.
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
},{ // mongoose.Schema metodunun 2. argümanı
    timestamps: true    // default olarak false idi
});

userSchema.virtual("tasks", {
    ref: "tasks",
    localField: "_id",
    foreignField: "owner"   // ilişki kurulmuş koleksiyondaki field'ın ismi olacak
})

// Her nesnenin, o nesnede JSON.stringify () çağrısının çıktısının ne olacağını özelleştirmek için geçersiz kılabileceğiniz 
// bir toJSON yöntemi vardır.
userSchema.methods.toJSON = function(){ 
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;   // responsedan kaldırmak için yaptık

    return userObject;
}

// methods metodlarına instance metodları da denir
// oturum açmayı başaran kullanıcıya token verilecek
userSchema.methods.generateAuthToken = async function(){
    const user = this;  // this, metodu çağıran nesnemizi işaret edecek
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET);
//  ilk parametre olan {_id: user._id.toString()} tokena gömülecek olan verileri içerir. String olmalı. (payload)
//  2. parametre ise tokenı imzalamak için kullanılır. (secret)
    user.tokens = user.tokens.concat({token});  // yeni tokenları birleştirmek için
    await user.save();  // token bilgilerini veri tabanına kaydetmek için

    return token;
}

// statics metodlara Model metodları da denir
// findByCredentials metodu e-postayı ve şifreyi alacak ve e-postayla bir kullanıcıyı bulmaya çalışacak ve şifreyi doğrulayacaktır.
userSchema.statics.findByCredentials = async (email, password) => { // findByCredentials yerine başka bir isim yazılabilir. Bir middleware fonksiyonudur.
    const user = await User.findOne({email});
    if(!user){
        throw new Error("Unable to login");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
        throw new Error("Unable to login");
    }

    return user;    // email ve password eşleştiyse user'ı döndürür
}

// hash the plain text password before saving
userSchema.pre("save", async function(next) {
    const user = this;

    if(user.isModified("password")){    // kullanıcı parolası daha önceden hash edildi mi bunu kontrol eder. Bu blok user ilk 
                                        // oluşturulduğunda veya güncellendiğinde çalışacak
        user.password = await bcrypt.hash(user.password, 8);    // 8 hash algoritmasının kaç defa çalışacağını söyler
    }

    next();
});   

// encryption algoritmaları geri döndürelebilir. Örneğin şifremiz "Mustafa123" olsun ve bunun şifrelenmiş hali "unlkqhxaqwl0*7894"
// olsun. Bu durumda şifrelenmiş algoritmaya ulaşan biri geri dönerek asıl şifreye ulaşmış olur.
// Fakat hashing algoritmaları böyle değildir. Şİfrelenmiş passwordlar geri döndürülemez.


// delete user tasks when user is removed
userSchema.pre("remove", async function(next) {
    const user = this;
    await Task.deleteMany({owner: user._id})
    next();
})

const User = mongoose.model("User", userSchema)


module.exports = User;