const jwt = require("jsonwebtoken");
const User = require("../models/user")

const auth = async (req, res, next) => {
    try {   // Bearer taşıyıcı demek. Bu sadece bir standart. "Digest", "Basic" gibi farklı kimlik doğrulama türleri de var. Ama kullanmak gerekli değil.
        const token = req.header("Authorization").replace("Bearer ",""); // replace kullanmamızın nedeni req.header'da verdiğimiz tokenı alabilmek. req.header'daki token'ın başında Bearer ifadesi bulunuyor.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({_id: decoded._id, "tokens.token": token});
        // "tokens.token" yazımı Mongoose'da özel bir yazım. Bu yazım "tokens dizisindeki bir nesneyi arayın ve bu değere
        // göre token özelliği olup olmadığını kontrol edin" demektir.
        // "In the tokens array, search all the objects' token property for the following value"
        if(!user) 
            throw new Error();
        
        req.token = token;  // kullanıcıya oturum açılırken verilen token (yukarıda kullanılan token). Eğer kullanıcı birden fazla tokena sahipse yalnızca birine sahip olur. (son açtığı)
        req.user = user;
        next();
    } catch (error) {
        res.status(401).send("Error: Please authenticate.");
    }
}

module.exports = auth;