const mongoose = require("mongoose");


mongoose.connect(process.env.MONGODB_URL , {     // veritabanına bağlanmak için
    useNewUrlParser: true,
    useCreateIndex: true,   // Bu, Mongoose'un MongoDB ile çalıştığı zaman, erişmemiz gereken verilere hızlı bir şekilde erişmemize olanak tanıyan indekslerimizin oluşturulduğundan emin olacak.
    useUnifiedTopology: true,
    useFindAndModify: false
})
// Mongoose veri tabanında herhangi bir collection oluşturmamama rağmen "users" adında bir collection oluşturdu. Bu Mongoose
// tarafından oluşturduğumuz modelin ismini alıp küçük harflere dönüştürüp onu çoğul hale getirerek otomatik olarak yapar.