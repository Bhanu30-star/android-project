<?php 
include("../../connect.php"); 
if(isset($_POST['json']))
{
   $distributor_id=$_POST['distributor_id'];
   $jsonData=$_POST['json'];
   $array_json=json_decode($jsonData,true);
   foreach ($array_json as $row) 
   {
      $txn_id=$row['txn_id'];
      $quantity=$row['quantity'];
      $amount=$row['amount'];
      $date=$row['date'];
      $retailer_no=$row['retailer_no'];
      $fse_no=$row['fse_no'];
      $check= mysqli_query($con,"SELECT * FROM `tbl_client_auto_sync_message_detail` WHERE message_txn_id='$txn_id'");
      if(mysqli_num_rows($check)==0)
      {
        $query=mysqli_query($con,"INSERT INTO `tbl_client_auto_sync_message_detail`(`distributor_id`, `type_detail`, `message_type`, `message_date`, `quantity`, `amount`, `message_txn_id`, `retailer_phone`, `fse_phone`)VALUES ($distributor_id,'Sale','Auto Refill','$date' ,'$quantity','$amount','$txn_id','$retailer_no','$fse_no')");
        $response["success"]=1;
        $response['message']="Data inserted successfully !!";
      }
      else
     {
      $response["success"]=0;
      $response["message"]="Refill already exists";
     }
   }

}
else
{
  $response["status"]=0;
  $response["message"]="Required feild missing";
}
echo json_encode($response);
?>