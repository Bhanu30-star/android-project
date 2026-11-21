<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['transaction_id']) && isset($_POST['distributor_id']) && isset($_POST['total_order']))
{
	$id1 = $_POST['transaction_id'];
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scro = date("h:i:s");
	$da  = date("Y-m-d");
	$scri =$da." ".$scro;
	$total_order = $_POST['total_order'];
	$distri_id=$ver;
	$fos_user_id="";
	$res_result_fos = mysqli_query($con,"select user_id from tbl_user_request where transaction_id='$id1'");
	while($fetch_result_fos=mysqli_fetch_assoc($res_result_fos))
	{
		$fos_user_id=$fetch_result_fos['user_id'];
	}
	$json_a=json_decode($total_order, true);     
	foreach ($json_a as $person_a)
	{
		$txn_product_id=$person_a['product_id'];
		$txn_detail_id=$person_a['txn_detail_id'];
		$quantity=$person_a['quantity'];
		$t_selectimei=$person_a['imei_detail'];
		$uq1=mysqli_query($con,"update tbl_user_request_detail set quantity='$quantity' where transaction_detail_id='$txn_detail_id'"); 
		if($t_selectimei!='')
		{
			$temp_explode1=explode(",",$t_selectimei);
			for($vb=0;$vb<sizeof($temp_explode1);$vb++)
			{
				$uq1=mysqli_query($con,"update tbl_product_serialno set user_id='$fos_user_id',assign_date='$da',assign_time='$scro',request_id='$id1' where IMEI='$temp_explode1[$vb]' and product_id='$txn_product_id'"); 
			}
		}
	}
	$res_result = mysqli_query($con,"select tbl_user_request_detail.quantity,tbl_product.product_price from tbl_user_request_detail, tbl_product where tbl_user_request_detail.product_id=tbl_product.product_id and tbl_user_request_detail.transaction_id='$id1'");  
	$final_amount=0;											
	while($fetch_result=mysqli_fetch_assoc($res_result))
	{
		$temp_quantity1=$fetch_result['quantity'];
		$temp_product_price1=$fetch_result['product_price'];
		$final_amount=$final_amount+($temp_quantity1*$temp_product_price1);
	}																
	$uq2=mysqli_query($con,"update tbl_user_request set total_amount='$final_amount',edit_datetime='$scri' where transaction_id='$id1'"); 
	
	if($uq2)
	{
		$txn_u_id="";
		$user_request_check = mysqli_query($con,"SELECT * FROM tbl_user_request where transaction_id ='$id1' and status='Pending'");
		if(mysqli_num_rows($user_request_check)>0)
		{
			$user_request_query = mysqli_query($con,"SELECT * FROM tbl_user_request where transaction_id ='$id1'");
			while($row_request_query=mysqli_fetch_assoc($user_request_query))
			{
				$txn_date=$row_request_query['transaction_date'];
				$txn_time=$row_request_query['transaction_time'];
				$txn_utxn_id=$row_request_query['user_transaction_id'];
				$txn_amount=$row_request_query['total_amount'];
				$txn_u_id=$row_request_query['user_id'];
				$txn_partyid=$row_request_query['party_id'];
				$txn_complete_dt =$scri;
				$st_query1 = mysqli_query($con,"insert into tbl_user_request_txn(transaction_date,transaction_time,user_transaction_id,total_amount,user_id,status,txn_datetime,action_by,party_id)values('$txn_date','$txn_time','$txn_utxn_id','$txn_amount','$txn_u_id','Complete','$txn_complete_dt','$ver','$txn_partyid')");
			}
			$query = mysqli_query($con,"insert into tbl_user_message(distributor_id,title,message,create_date,create_time,user_id )values('$ver','Stock Request Approve','Your currently submitted Stock Request is Approved.','$da','$scro','$txn_u_id')");
			$query11="SELECT transaction_id FROM  tbl_user_request_txn where user_id ='$txn_u_id' ORDER BY `transaction_id` DESC LIMIT 1";
			$res11 = mysqli_query($con,$query11);
			$row11 =  mysqli_fetch_assoc($res11);
			if(mysqli_num_rows($res11)>0)
			{		
				$re11= $row11['transaction_id'];
			}
			$user_request_detail_query = mysqli_query($con,"SELECT product_id,product_name,quantity FROM tbl_user_request_detail where transaction_id ='$id1'");
			while($detail_request_query=mysqli_fetch_assoc($user_request_detail_query))
			{
				$prodid=$detail_request_query['product_id'];
				$prodname=$detail_request_query['product_name'];
				$ordquantiy=$detail_request_query['quantity'];
				$query21=mysqli_query($con,"insert into tbl_user_request_detail_txn(transaction_id,product_id,product_name,quantity )values('$re11','$prodid','$prodname','$ordquantiy')");
			}
			$res1 = mysqli_query($con,"SELECT tbl_user_request_detail.product_id,tbl_user_request_detail.quantity, tbl_user_request.user_id FROM tbl_user_request_detail,tbl_user_request where tbl_user_request_detail.transaction_id =tbl_user_request.transaction_id and  tbl_user_request_detail.transaction_id ='$id1'");
			if(mysqli_num_rows($res1)>0)
			{	
				while($row=mysqli_fetch_assoc($res1))
				{
					$prodid= $row['product_id'];
					$ordquantiy=$row['quantity'];
					$tmp_uid=$row['user_id'];
					$query_stock="SELECT quantity FROM  tbl_user_stock where date ='$da' and user_id='$tmp_uid' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1";
					$res_stock = mysqli_query($con,$query_stock);
					$row_stock =  mysqli_fetch_assoc($res_stock);
					if(mysqli_num_rows($res_stock)>0)
					{
						$stock_quantity=$row_stock['quantity'];
						$temp_quantity=$stock_quantity+$ordquantiy;
						$uq=mysqli_query($con,"UPDATE tbl_user_stock SET quantity='$temp_quantity' where date ='$da' and user_id='$tmp_uid' and product_id='$prodid'");	
					}
					else
					{
						$query_stock1="SELECT quantity FROM  tbl_user_stock where date <='$da' and user_id='$tmp_uid' and product_id='$prodid' ORDER BY `date` DESC LIMIT 1";
						$res_stock1 = mysqli_query($con,$query_stock1);
						$row_stock1 =  mysqli_fetch_assoc($res_stock1);
						if(mysqli_num_rows($res_stock1)>0)
						{
							$stock_quantity=$row_stock1['quantity'];
							$temp_quantity=$stock_quantity+$ordquantiy;
							$stock_insert=mysqli_query($con,"insert into tbl_user_stock(user_id,product_id,opening_stock,quantity,date)values('$tmp_uid','$prodid','$stock_quantity','$temp_quantity','$da')");
						}
						else
						{
							$stock_insert=mysqli_query($con,"insert into tbl_user_stock(user_id,product_id,opening_stock,quantity,date)values('$tmp_uid','$prodid','0','$ordquantiy','$da')");
						}
					}
				}
			}
			$update_result = mysqli_query($con,"select tbl_user_request_detail.product_id,tbl_user_request_detail.quantity,tbl_product.stock_quantity from tbl_user_request_detail,tbl_product where tbl_user_request_detail.product_id=tbl_product.product_id and tbl_user_request_detail.transaction_id='$id1'");									
			while($fetch_update=mysqli_fetch_assoc($update_result))
			{
				$feth_pro=$fetch_update['product_id'];
				$temp_11=$fetch_update['quantity'];
				$set_quan=$fetch_update['stock_quantity']-$fetch_update['quantity'];
				$uq21=mysqli_query($con,"update tbl_product set stock_quantity='$set_quan',	tb_updatedatetime='$scri' where product_id='$feth_pro' and distributor_id='$distri_id'"); 
				$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);
				$query = mysqli_query($con,"insert into tbl_distributor_transaction(transaction_id,product_id,distributor_id,quantity, transaction_date,transaction_time,txn_type,user_id)values('$transaction_id','$feth_pro','$distri_id','$temp_11','$da','$scro','Transfer','$tmp_uid')");
				if($query)
				{
					$query_stock="SELECT closing_stock FROM  tbl_distributor_stock where date ='$da' and distributor_id='$distri_id' and product_id='$feth_pro' ORDER BY `date` desc";
					$res_stock = mysqli_query($con,$query_stock);
					$row_stock =  mysqli_fetch_assoc($res_stock);
					if(mysqli_num_rows($res_stock)>0)
					{
						$stock_quantity=$row_stock['closing_stock'];
						$temp_quantity=$stock_quantity-$temp_11;
						$uq11=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock='$temp_quantity',time='$scro' where date ='$da' and distributor_id='$distri_id' and product_id='$feth_pro'");	
					}
					else
					{
						$query_stock1="SELECT closing_stock FROM  tbl_distributor_stock where date <='$da' and distributor_id='$distri_id' and product_id='$feth_pro' ORDER BY `date` DESC LIMIT 1";
						$res_stock1 = mysqli_query($con,$query_stock1);
						$row_stock1 =  mysqli_fetch_assoc($res_stock1);
						if(mysqli_num_rows($res_stock1)>0)
						{
							$stock_quantity=$row_stock1['closing_stock'];
							$temp_quantity=$stock_quantity-$temp_11;
							$stock_insert1=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock,closing_stock,date,time)values('$distri_id','$feth_pro','$stock_quantity','$temp_quantity','$da','$scro')");
						}
						else
						{
							$stock_insert1=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock,closing_stock,date,time)values('$distri_id','$feth_pro','0','$temp_11','$da','$scro')");
						}
					}
				}				
			}
			$uq1=mysqli_query($con,"UPDATE tbl_user_request SET status='Complete',complete_date='$da',complete_time='$scro' where transaction_id='$id1'");
		}
		
		$FIREBASE_API_KEY="AAAAZno7F7E:APA91bH7hbOcUWxp29ZfjJ4vQp-IMpuzZ3y5wNnIBRCzLOS3Fl7dD4RRzslJ4fxF5fIGoIHjcZ5kYPvVW8Obk7dI4moxP8BGbg3J47xHtEiOGZYTnOr60Rz3izk1axcCC_P0krknYmnw";
		$url = 'https://fcm.googleapis.com/fcm/send';
		$headers = array(
					'Authorization: key=' . $FIREBASE_API_KEY,
					'Content-Type: application/json'
		);
		$sendNotify = mysqli_query($con,"SELECT * FROM tbl_user where user_id='$tmp_uid' and status='Active'");
		$ch = curl_init ();
		while($rowNotify=mysqli_fetch_assoc($sendNotify))
		{ 
				$title="Stock request status";
				$varMSG="Your Stock request ".$txn_utxn_id." has been approved!!";
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
		$response['details']="Request Approved Successfully";
	}
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>