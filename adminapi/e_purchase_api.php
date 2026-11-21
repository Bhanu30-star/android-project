<?php 
  include("../../connect.php"); 
   if(isset($_POST['json'])){
	          $distributor_id=$_POST['distributor_id'];
	          $purchase_party_id=$_POST['purchase_party_id'];
	         $jsonData=$_POST['json'];
	         $array_json=json_decode($jsonData,true);
            foreach ($array_json as $row) {
							$txn_id=$row['txn_id'];
							$quantity=$row['quantity'];
							$date=$row['date'];
                            $check= mysqli_query($con,"SELECT * FROM `tbl_client_auto_sync_message_detail` WHERE message_txn_id='$txn_id'");
                       if(mysqli_num_rows($check)==0){
                            $query=mysqli_query($con,"INSERT INTO `tbl_client_auto_sync_message_detail`(`distributor_id`, `type_detail`, `message_type`, `message_date`, `quantity`,`message_txn_id`, `purchase_party_id`)
                             VALUES ($distributor_id,'Purchase','E-Purchase','$date','$quantity','$txn_id','$purchase_party_id')");
                                $response["success"]=1;
					            $response['message']="Data inserted successfully !!";
                         }else{
					            $response["success"]=0;
					            $response["message"]=" This e-purchase already exists";
                               }
                     }
     }else{
			$response["status"]=0;
			$response["message"]="Required feild missing";
           }
         echo json_encode($response);
  ?>