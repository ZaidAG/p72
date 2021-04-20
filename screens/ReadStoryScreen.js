import React from 'react'
import{Text,View,TouchableOpacity,StyleSheet, TextInput,Image,KeyboardAvoidingView,ToastAndroid} from 'react-native'
import * as Permissions from 'expo-permissions'
import {BarCodeScanner} from 'expo-barcode-scanner'
import * as firebase from 'firebase/firestore'
import db from '../config'
export default class BookTransactionScreen extends React.Component{
    constructor(){
        super();
        this.state={
            hasCameraPermissions:null,
            scanned:false,
            scannedBookId:'',
            scannedStudentId:'',
            buttonState:'normal'
        }
    }
    getCameraPermission=async()=>{
        const{status}=await Permissions.askAsync(Permissions.CAMERA)
        this.state=({
            hasCameraPermissions:status==="granted",
            buttonState:id,
            scanned:false
        })
    }
    handleBarCodeScanned=async({type,data})=>{
        const {buttonState} = this.state 
        if(buttonState==="BookId"){ 
            this.setState({ scanned: true, scannedBookId: data, buttonState: 'normal' }); } 
            else if(buttonState==="StudentId"){ 
                this.setState({ scanned: true, scannedStudentId: data, buttonState: 'normal' }); }
    }
    initiateBookIssue=async()=>{
        db.collection("transaction").add({
            'studentId' : this.state.scannedStudentId,
             'bookId' : this.state.scannedBookId,
              'data' : firebase.firestore.Timestamp.now().toDate(),
               'transactionType' : "Issue"

        })
        db.collection("books").doc(this.state.scannedBookId).update({
            'bookAvailability' : false
        })
        db.collection("students").doc(this.state.scannedStudentId).update({
            'numberOfBooksIssued' : firebase.firestore.FieldValue.increment(1)
        })
        this.setState({scannedStudentId:'',
        scannedBookId:''
    })
    }
    initiateBookReturn=async()=>{
        db.collection("transaction").add({
            'studentId' : this.state.scannedStudentId,
             'bookId' : this.state.scannedBookId,
              'data' : firebase.firestore.Timestamp.now().toDate(),
               'transactionType' : "Return"

        })
        db.collection("books").doc(this.state.scannedBookId).update({
            'bookAvailability' : true
        })
        db.collection("students").doc(this.state.scannedStudentId).update({
            'numberOfBooksIssued' : firebase.firestore.FieldValue.increment(-1)
        })
        this.setState({scannedStudentId:'',
        scannedBookId:''
    })
    }
    handleTransaction=async()=>{
        var transactionMessage
        db.collection("books").doc(this.state.scannedBookId).get()
        .then((doc)=>{
            var books=doc.data()
                if(books.bookAvailability){
                    this.initiateBookIssue();
                    transactionMessage='Book Issued'
                    ToastAndroid.show(transactionMessage,ToastAndroid.SHORT)
                }
                else{
                    this.initiateBookReturn();
                    transactionMessage='Book Returned'
                    ToastAndroid.show(transactionMessage,ToastAndroid.SHORT)
                }
        })
        this.setState({
            transactionMessage:transactionMessage
        })
    }
    render(){
        const hasCameraPermissions=this.state.hasCameraPermissions
        const scanned=this.state.scanned
        const buttonState=this.state.buttonState
        if(buttonState!=="normal"&&hasCameraPermissions){
            return(
                <BarCodeScanner
                onBarCodeScanned={scanned ? undefined:this.handleBarCodeScanned}
                style={
                    StyleSheet.absoluteFillObject
                }
                />
            )
        }
        else if(buttonState==="normal"){
        return(
            <KeyboardAvoidingView style={styles.container}behavior="padding"enabled>
                <View>
                    <Image
                    source={require('../assets/booklogo.jpg')}
                    style={{width:200,height:200}}/>
                    <Text styles={{textAllign:'center',fontSize:30}}>Wily</Text>
                </View>
                <View style={styles.inputView}>
                    <TextInput
                    style={styles.inputBox}
                    placeholder = "Book ID"
                    onChangeText={
                        text=>this.setState({scannedBookId:text})
                    }
                value={this.state.scannedBookId}/>
                <TouchableOpacity
                
                style={styles.scanButton}
                    onPress={()=>{
                        this.getCameraPermission("BookId")
                    }}>
                   <Text style={styles.buttonText}>
                    Scan QR Code
                </Text> 
                </TouchableOpacity>

            </View>
            <View style={styles.inputView}>
                    <TextInput
                    style={styles.inputBox}
                    placeholder = "Student ID"
                    onChangeText={
                        text=>this.setState({scannedStudentId:text})
                    }
                value={this.state.scannedStudentId}/>
                <TouchableOpacity
                
                style={styles.scanButton}
                     onPress={()=>{
                        this.getCameraPermission("StudentId")
                    }}>
                   <Text style={styles.buttonText}>
                    Scan QR Code
                </Text> 
                </TouchableOpacity>
                </View>
                <TouchableOpacity
                style={styles.submitButton}
                onPress={async()=>{
                    var transactionMessage=this.handleTransaction()
                    this.setState({
                       scannedBookId:'',
                       scannedStudentId:''
                    })
                    }}>
                    <Text style = {styles.submitButtonText}>
                        Submit
                        </Text>
                </TouchableOpacity>
                </KeyboardAvoidingView>
                    
        )
    }
}
}
const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    displayText:{
        fontSize:15,
        textDecorationLine:'underline',
    },
    scanButton:{
        backgroundColor:'red',
        padding:10,
        margin:10,
    },
    buttonText:{
        fontSize:15,
        textAlign:'center',
        marginTop:10
    },
    inputView:{
        flexDirection:'row',
        margin:20
    },
    inputBox:{
        width:200,
        height:40,
        borderWidth:1.5,
        borderRightWidth:0,
        fontSize:20,
    },
    scanButton:{
        backgroundColor:'green',
        width:50,
        borderWidth:1.5,
        borderLeftWidth:0
    },
    submitButton:{
        backgroundColor:'#FBC02D',
        width:100,
        height:50
    },
    submitButtonText:{
        padding:10,
        textAlign:'center',
        fontSize:20,
        fontWeight:'bold',
        color:'white'
    }
  });