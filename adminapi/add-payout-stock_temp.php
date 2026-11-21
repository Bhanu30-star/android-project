<?php
include("../../connect.php");
$response = array();
if(isset($_POST['total_order']) && isset($_POST['distributor_id']))
{
	$ver=$_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$scri=date('H:i:sa');
	$cdate=date("Y-m-d");
	$billdate1=$_POST['date'];
	$da  = $cdate." ".date('H:i:sa');

	$total=$_POST['total'];
	$add_pro_type='VODA LAPU';
	$toder = $_POST['total_order'];
	
	$json_a=json_decode($toder, true);     
	foreach ($json_a as $person_a)
	{
		$proid=$person_a['pid'];
		$proname=$person_a['pro_name'];
		$proprice='';
		$pquanity=$person_a['quantity'];
		$message_id=$person_a['message_id'];
		$add=$person_a['type'];
		$res_lapu = mysqli_query($con,"select * from tbl_product where status='Active' and distributor_id='$ver' and product_id='$proid'");
		while($fetch_LAPU=mysqli_fetch_assoc($res_lapu))
		{
			$proid=$fetch_LAPU['product_id'];
			$temp_quantity_temp=$fetch_LAPU['stock_quantity'];
		}
		$res_lapu_ = mysqli_query($con,"select * from tbl_distributor_stock_add_reduce where status='Complete' and distributor_id='$ver' and product_id='$proid' and message_id='$message_id'");
		while($fetch_message=mysqli_fetch_assoc($res_lapu_))
		{
			$message_id_=$fetch_message['message_id'];
		}
		if($message_id!=$message_id_){
			if($add!=""){
				if($add=='Add'){
					$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);
					$query = mysqli_query($con,"INSERT INTO `tbl_distributor_stock_add_reduce`(`transaction_id`, `product_id`, `distributor_id`, `message_id`, `message_date`,`bag_type`, `bag_qty`, `quantity`, `price`, `transaction_date`, `transaction_time`, `txn_type`, `remark_detail`,`amount`,`transaction_type`,`inserted_at`) VALUES ('$transaction_id','$proid','$ver','$message_id','$billdate1','0','0','$pquanity','$proprice','$cdate','$scri','Add','','$pamount','Payout','$da')");
					$res_stock = mysqli_query($con,"SELECT closing_stock FROM  tbl_distributor_stock where date ='$cdate' and distributor_id='$ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1");
					$row_stock =  mysqli_fetch_assoc($res_stock);
					if(mysqli_num_rows($res_stock)>0)
					{
						$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock+'$pquanity',2),time='$scri' where date ='$cdate' and distributor_id='$ver' and product_id='$proid'");
						$uq2=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock+'$pquanity',2), opening_stock = round(opening_stock+'$pquanity',2),time='$scri' where date >'$cdate' and distributor_id='$ver' and product_id='$proid'");
						$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity+'$pquanity',2),tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
					}
					else
					{
						$query_stock1="SELECT closing_stock FROM tbl_distributor_stock where date <='$cdate' and distributor_id='$ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1";
						$res_stock1 = mysqli_query($con,$query_stock1);
						$row_stock1 =  mysqli_fetch_assoc($res_stock1);
						if(mysqli_num_rows($res_stock1)>0)
						{
							$stock_quantity=$row_stock1['closing_stock'];
							$temp_quantity=round($stock_quantity+$pquanity,2);
							$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock, closing_stock, date,time)values('$ver','$proid','$stock_quantity','$temp_quantity','$cdate','$scri')");
							$uq2=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock+'$pquanity',2), opening_stock = round(opening_stock+'$pquanity',2),time='$scri' where date >'$cdate' and distributor_id='$ver' and product_id='$proid'");
							$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity+'$pquanity',2),tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
						}
						else
						{
							$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock,closing_stock,date, time)values('$ver','$proid','0','$pquanity','$cdate','$scri')");
							$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity+'$pquanity',2),tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
						}
					}	
				}else{
					if($temp_quantity_temp>=$pquanity){
						$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);
						$query = mysqli_query($con,"INSERT INTO `tbl_distributor_stock_add_reduce`(`transaction_id`, `product_id`, `distributor_id`, `message_id`, `message_date`,`bag_type`, `bag_qty`, `quantity`, `price`, `transaction_date`, `transaction_time`, `txn_type`, `remark_detail`,`amount`,`transaction_type`,`inserted_at`) VALUES ('$transaction_id','$proid','$ver','$message_id','$billdate1','0','0','$pquanity','$proprice','$cdate','$scri','Reduce','','$pamount','Payout','$da')");
						$res_stock = mysqli_query($con,"SELECT closing_stock FROM  tbl_distributor_stock where date ='$cdate' and distributor_id='$ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1");
						$row_stock =  mysqli_fetch_assoc($res_stock);
						if(mysqli_num_rows($res_stock)>0)
						{
							$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock-'$pquanity',2),time='$scri' where date ='$cdate' and distributor_id='$ver' and product_id='$proid'");
							$uq2=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock-'$pquanity',2), opening_stock = round(opening_stock-'$pquanity',2),time='$scri' where date >'$cdate' and distributor_id='$ver' and product_id='$proid'");
							$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity-'$pquanity',2),tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
						}
						else
						{
							$query_stock1="SELECT closing_stock FROM  tbl_distributor_stock where date <='$cdate' and distributor_id='$ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1";
							$res_stock1 = mysqli_query($con,$query_stock1);
							$row_stock1 =  mysqli_fetch_assoc($res_stock1);
							if(mysqli_num_rows($res_stock1)>0)
							{
								$stock_quantity=$row_stock1['closing_stock'];
								$temp_quantity=round($stock_quantity-$pquanity,2);
								$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock, closing_stock, date,time)values('$ver','$proid','$stock_quantity','$temp_quantity','$cdate','$scri')");
								$uq2=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock-'$pquanity',2), opening_stock = round(opening_stock-'$pquanity',2),time='$scri' where date >'$cdate' and distributor_id='$ver' and product_id='$proid'");
								$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity-'$pquanity',2),tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
							}
							else
							{
								$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock,closing_stock,date, time)values('$ver','$proid','0','-$pquanity','$cdate','$scri')");
								$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity-'$pquanity',2),tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
							}
						}
					}
				}
				if($query)
				{
					$response['success']='1';
					$response['details']="Stock successfully uploaded!";
				}
				else if(($temp_quantity_temp<=$pquanity)&&($add!='Add'))
				{
					$response['success']=0;
					$response['details']="Quantity should be less than or equal to  ".$temp_quantity_temp."!";
				}else{
					$response['success']='0';
					$response['details']="Insertion error....!";
				}
			}else{
				$response['success']=0;
				$response['details']="Type field is empty";
			}
		}else{
			$response['success']=0;
			$response['details']="Duplicate Message Id";
		}
	}
	
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);


?>