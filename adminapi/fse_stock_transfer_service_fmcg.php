<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['key_uid']) && isset($_POST['amount']) && isset($_POST['total_order']) && isset($_POST['distributor_id']))
{
	$client1 = $_POST['key_uid'];
	$message_txn_id = isset($_POST['message_txn_id']) ? $_POST['message_txn_id'] : '';
	$user_phone = isset($_POST['user_phone']) ? $_POST['user_phone'] : '';
	$message_date = isset($_POST['message_date']) ? $_POST['message_date'] : '';
	$message_time = isset($_POST['message_time']) ? $_POST['message_time'] : '';
	$message_amount = isset($_POST['message_amount']) ? $_POST['message_amount'] : '';
	$session_dist_ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("h:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$amount = $_POST['amount'];  
	$toder = $_POST['total_order']; 	
	$request_type = isset($_POST['request_type']) ? $_POST['request_type'] : '';
	$uniqueId=uniqid();
	$uniqueId1=strtoupper($uniqueId);
	$sd="UR".$uniqueId1;
	
	$msg_insert_check=0;
	if($message_txn_id!='')
	{
		$select_message=mysqli_query($con,"SELECT * from `tbl_fse_stock_transfer_message` where user_id='$client1' AND transaction_id='$message_txn_id'");
		if(mysqli_num_rows($select_message)<=0)
		{
			$query_message=mysqli_query($con,"INSERT INTO `tbl_fse_stock_transfer_message`(`user_id`, `transaction_id`, `amount`, `user_phone`, `message_date`, `message_time`, `insert_date`, `insert_time`, `status`, `complete_date`, `complete_time`) VALUES ('$client1','$message_txn_id','$message_amount','$user_phone','$message_date','$message_time','$da','$scro','Complete','$da','$scro')");
			$msg_insert_check=0;
		}
		else
		{
			$msg_insert_check=1;
		}
	}
	if($msg_insert_check==0)
	{
		$res = mysqli_query($con,"insert into tbl_user_request(transaction_date,transaction_time, user_transaction_id, total_amount, user_id,request_type,status,complete_date,complete_time,action_source)values('$da','$scro','$sd','$amount','$client1','$request_type','Complete','$da','$scro','Admin')");			
		if($res)
		{
			$res1 = mysqli_query($con,"SELECT * FROM  tbl_user_request where user_id ='$client1' and  user_transaction_id='$sd' ORDER BY `transaction_id` DESC LIMIT 1");
			$row =  mysqli_fetch_assoc($res1);
			$re= $row['transaction_id'];
			$json_a=json_decode($toder, true);     
			foreach ($json_a as $person_a)
			{
				$prodid = isset($person_a['pid']) ? $person_a['pid'] : (isset($person_a['product_id']) ? $person_a['product_id'] : 0);
				$prodname = isset($person_a['pname']) ? $person_a['pname'] : (isset($person_a['product_name']) ? $person_a['product_name'] : '');
				$pro_price = isset($person_a['pro_price']) ? $person_a['pro_price'] : (isset($person_a['price']) ? $person_a['price'] : 0);
				$ordquantiy = isset($person_a['quantity']) ? $person_a['quantity'] : 0;
				$query2=mysqli_query($con,"insert into tbl_user_request_detail(transaction_id,product_id, product_name, quantity, product_price)values('$re','$prodid','$prodname','$ordquantiy','$pro_price')");
				
				$res_stock = mysqli_query($con,"SELECT quantity FROM  tbl_user_stock where date ='$da' and user_id='$client1' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1");
				if(mysqli_num_rows($res_stock)>0)
				{
					$row_stock =  mysqli_fetch_assoc($res_stock);
					$stock_quantity=$row_stock['quantity'];
					$temp_quantity=round($stock_quantity+$ordquantiy,2);
					$uq=mysqli_query($con,"UPDATE tbl_user_stock SET quantity='$temp_quantity' where date ='$da' and user_id='$client1' and product_id='$prodid'");	
				}
				else
				{
					$res_stock1 = mysqli_query($con,"SELECT quantity FROM  tbl_user_stock where date <='$da' and user_id='$client1' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1");
					if(mysqli_num_rows($res_stock1)>0)
					{
						$row_stock1 =  mysqli_fetch_assoc($res_stock1);
						$stock_quantity=$row_stock1['quantity'];
						$temp_quantity=round($stock_quantity+$ordquantiy,2);
						$stock_insert=mysqli_query($con,"insert into tbl_user_stock(user_id,product_id,opening_stock, quantity,date)values('$client1','$prodid','$stock_quantity','$temp_quantity','$da')");
					}
					else
					{
						$stock_insert=mysqli_query($con,"insert into tbl_user_stock(user_id,product_id,opening_stock, quantity,date)values('$client1','$prodid','0','$ordquantiy','$da')");
					}
				}		
				$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);
				$query = mysqli_query($con,"insert into tbl_distributor_transaction(transaction_id,product_id,distributor_id,quantity, transaction_date,transaction_time,txn_type,user_id,message_txn_id)values('$transaction_id','$prodid','$session_dist_ver','$ordquantiy','$da','$scro','Transfer','$client1','$message_txn_id')");
				$res_stock = mysqli_query($con,"SELECT closing_stock FROM  tbl_distributor_stock where date ='$da' and distributor_id='$session_dist_ver' and product_id='$prodid' ORDER BY `date` desc limit 1");
				$row_stock =  mysqli_fetch_assoc($res_stock);
				if(mysqli_num_rows($res_stock)>0)
				{
					$stock_quantity=$row_stock['closing_stock'];
					$temp_quantity=round($stock_quantity-$ordquantiy,2);
					$uq11=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock='$temp_quantity',time='$scro' where date ='$da' and distributor_id='$session_dist_ver' and product_id='$prodid'");	
					$uq21=mysqli_query($con,"update tbl_product set stock_quantity='$temp_quantity',tb_updatedatetime='$scri' where product_id='$prodid' and distributor_id='$session_dist_ver'"); 
				}
				else
				{
					$query_stock1="SELECT closing_stock FROM  tbl_distributor_stock where date <='$da' and distributor_id='$session_dist_ver' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1";
					$res_stock1 = mysqli_query($con,$query_stock1);
					if(mysqli_num_rows($res_stock1)>0)
					{
						$row_stock1 =  mysqli_fetch_assoc($res_stock1);
						$stock_quantity=$row_stock1['closing_stock'];
					}
					else
					{
						$prod_stock_q = mysqli_query($con, "SELECT stock_quantity FROM tbl_product WHERE product_id='$prodid' AND distributor_id='$session_dist_ver'");
						$fetch_prod_sq = mysqli_fetch_assoc($prod_stock_q);
						$stock_quantity = isset($fetch_prod_sq['stock_quantity']) ? $fetch_prod_sq['stock_quantity'] : 0;
					}
					$temp_quantity=round($stock_quantity-$ordquantiy,2);
					$stock_insert1=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock, closing_stock,date,time)values('$session_dist_ver','$prodid','$stock_quantity','$temp_quantity','$da','$scro')");
					$uq21=mysqli_query($con,"update tbl_product set stock_quantity='$temp_quantity',tb_updatedatetime='$scri' where product_id='$prodid' and distributor_id='$session_dist_ver'"); 
				}
			}
			$FIREBASE_API_KEY="AAAAZno7F7E:APA91bH7hbOcUWxp29ZfjJ4vQp-IMpuzZ3y5wNnIBRCzLOS3Fl7dD4RRzslJ4fxF5fIGoIHjcZ5kYPvVW8Obk7dI4moxP8BGbg3J47xHtEiOGZYTnOr60Rz3izk1axcCC_P0krknYmnw";
			$url = 'https://fcm.googleapis.com/fcm/send';
			$headers = array(
				'Authorization: key=' . $FIREBASE_API_KEY,
				'Content-Type: application/json'
			);
			$sendNotify = mysqli_query($con,"SELECT * FROM tbl_user where user_id='$client1' and status='Active'");
			$ch = curl_init ();
			while($rowNotify=mysqli_fetch_assoc($sendNotify))
			{ 
				$title="Stock Transfer status";
				$varMSG="Stock Transfer Successfully Done by the Distributor!! Please check and confirm";
				$key=$rowNotify['device_id'];
				$fields = array('to' => $key, 'notification' =>array('title'=>$title,'body'=>$varMSG));
				$payload = json_encode ( $fields );
				curl_setopt ( $ch, CURLOPT_URL, $url );
				curl_setopt ( $ch, CURLOPT_POST, true );
				curl_setopt ( $ch, CURLOPT_HTTPHEADER, $headers );
				curl_setopt ( $ch, CURLOPT_RETURNTRANSFER, true );
				curl_setopt($ch, CURLOPT_SSL_VERIFYPEER,FALSE);
				//curl_setopt($ch,CURLOPT_SSL_VERIFYHOST,0);
				curl_setopt($ch,CURLOPT_IPRESOLVE,CURL_IPRESOLVE_V4);
				curl_setopt ( $ch, CURLOPT_POSTFIELDS, $payload);
				$result = curl_exec ( $ch );
			}
			curl_close ( $ch );
			$response['success']='1';
			$response['details']="Stock Transfer Successfully";
		}
		else
		{		
			$response['success']='0';
			$response['details']="Insertion Error.";
		}
	}
	else
	{
		$response['success']=0;
		$response['details']="Message transaction id already exists!";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>