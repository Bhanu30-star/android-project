<?php 
    include("../../connect.php"); 
  if(isset($_POST['json'])){
             $distributor_id=$_POST['distributor_id'];
             $jsonData=$_POST['json'];
             $array_json=json_decode($jsonData,true);
           foreach ($array_json as $row) {
                      $txn_id=$row['txn_id'];
                      $quantity=$row['quantity'];
                      $amount=$row['amount'];
                      $date=$row['date'];
                      $retailer_no=$row['retailer_no'];
                      $check= mysqli_query($con,"SELECT * FROM `tbl_client_auto_sync_message_detail` WHERE message_txn_id='$txn_id'");
                 if(mysqli_num_rows($check)==0){
                      $query=mysqli_query($con,"INSERT INTO `tbl_client_auto_sync_message_detail`(`distributor_id`, `type_detail`, `message_type`, `message_date`, `quantity`, `amount`, `message_txn_id`, `retailer_phone`) 
                        VALUES ($distributor_id,'Sale','Digital Transfer','$date','$quantity','$amount','$txn_id','$retailer_no')");
                      // $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$distributor_id', 'INSERT OPERATION,Digital Transfer#Admin(INSERT)tbl_client_auto_sync_message_detail', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");
                       $response["success"]=1;
                       $response['message']="Data inserted successfully !!";
                 }else{
                      $response["success"]=0;
                      $response["message"]=" This transfer already exists";
                    }
             }
     }else{
            $response["status"]=0;
            $response["message"]="Required feild missing";
          }          
           echo json_encode($response);
 ?>