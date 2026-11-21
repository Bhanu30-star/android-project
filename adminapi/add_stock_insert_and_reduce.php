<?php
include("../../connect.php");
$response = array();
if(isset($_POST['txn_type']) && isset($_POST['distributor_id']) && isset($_POST['productid']) && isset($_POST['quantity']))
{
	$temp_id=1;
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
	$purchase_txn_type=isset($_POST['txn_type']) ? $_POST['txn_type'] : 'Add';
	$remark = isset($_POST['remark']) ? $_POST['remark'] : '';	
	$proid=$_POST['productid'];
	$pquanity=$_POST['quantity'];
	$probagtype=isset($_POST['bag_type']) ? $_POST['bag_type'] : '0';
	$probagqty=isset($_POST['probagqty']) ? $_POST['probagqty'] : '0';
	$transaction_id = substr(uniqid(rand(),1),0,7).'_'.uniqid().'_'.substr(rand(),1,3);
	$proprice=$_POST['price'];
	$billdate1=$_POST['billdate'];
	$pamount=$_POST['amount'];
	
	$da  = $billdate1." ".date('H:i:sa');
	
	if($purchase_txn_type=='Add')
	{
		$query = mysqli_query($con,"INSERT INTO `tbl_distributor_stock_add_reduce`(`transaction_id`, `product_id`, `distributor_id`, `bag_type`, `bag_qty`, `quantity`, `price`, `transaction_date`, `transaction_time`, `txn_type`, `remark_detail`,`amount`) VALUES ('$transaction_id','$proid','$ver','$probagtype','$probagqty','$pquanity','$proprice','$billdate1','$scri','Add','$remark','$pamount')");
			
		$res_stock = mysqli_query($con,"SELECT closing_stock FROM  tbl_distributor_stock where date ='$billdate1' and distributor_id='$ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1");
		$row_stock =  mysqli_fetch_assoc($res_stock);
		if(mysqli_num_rows($res_stock)>0)
		{
			$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock+'$pquanity',2),time='$scri' where date ='$billdate1' and distributor_id='$ver' and product_id='$proid'");
			$uq2=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock+'$pquanity',2), opening_stock = round(opening_stock+'$pquanity',2),time='$scri' where date >'$billdate1' and distributor_id='$ver' and product_id='$proid'");
			$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity+'$pquanity',2),tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
		}
		else
		{
			$query_stock1="SELECT closing_stock FROM tbl_distributor_stock where date <='$billdate1' and distributor_id='$ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1";
			$res_stock1 = mysqli_query($con,$query_stock1);
			$row_stock1 =  mysqli_fetch_assoc($res_stock1);
			if(mysqli_num_rows($res_stock1)>0)
			{
				$stock_quantity=$row_stock1['closing_stock'];
				$temp_quantity=round($stock_quantity+$pquanity,2);
				$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock, closing_stock, date,time)values('$ver','$proid','$stock_quantity','$temp_quantity','$billdate1','$scri')");
				$uq2=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock+'$pquanity',2), opening_stock = round(opening_stock+'$pquanity',2),time='$scri' where date >'$billdate1' and distributor_id='$ver' and product_id='$proid'");
				$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity+'$pquanity',2),tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
			}
			else
			{
				$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock,closing_stock,date, time)values('$ver','$proid','0','$pquanity','$billdate1','$scri')");
				$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity+'$pquanity',2),tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
			}
		}	
	}
	else
	{
		$query = mysqli_query($con,"INSERT INTO `tbl_distributor_stock_add_reduce`(`transaction_id`, `product_id`, `distributor_id`, `bag_type`, `bag_qty`, `quantity`, `price`, `transaction_date`, `transaction_time`, `txn_type`, `remark_detail`,`amount`) VALUES ('$transaction_id','$proid','$ver','$probagtype','$probagqty','$pquanity','$proprice','$billdate1','$scri','Reduce','$remark','$pamount')");
			
		$res_stock = mysqli_query($con,"SELECT closing_stock FROM  tbl_distributor_stock where date ='$billdate1' and distributor_id='$ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1");
		$row_stock =  mysqli_fetch_assoc($res_stock);
		if(mysqli_num_rows($res_stock)>0)
		{
			$uq=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock-'$pquanity',2),time='$scri' where date ='$billdate1' and distributor_id='$ver' and product_id='$proid'");
			$uq2=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock-'$pquanity',2), opening_stock = round(opening_stock-'$pquanity',2),time='$scri' where date >'$billdate1' and distributor_id='$ver' and product_id='$proid'");
			$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity-'$pquanity',2),tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
		}
		else
		{
			$query_stock1="SELECT closing_stock FROM  tbl_distributor_stock where date <='$billdate1' and distributor_id='$ver' and product_id='$proid' ORDER BY `date` DESC LIMIT 1";
			$res_stock1 = mysqli_query($con,$query_stock1);
			$row_stock1 =  mysqli_fetch_assoc($res_stock1);
			if(mysqli_num_rows($res_stock1)>0)
			{
				$stock_quantity=$row_stock1['closing_stock'];
				$temp_quantity=round($stock_quantity-$pquanity,2);
				$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock, closing_stock, date,time)values('$ver','$proid','$stock_quantity','$temp_quantity','$billdate1','$scri')");
				$uq2=mysqli_query($con,"UPDATE tbl_distributor_stock SET closing_stock=round(closing_stock-'$pquanity',2), opening_stock = round(opening_stock-'$pquanity',2),time='$scri' where date >'$billdate1' and distributor_id='$ver' and product_id='$proid'");
				$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity-'$pquanity',2),tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
			}
			else
			{
				$stock_insert=mysqli_query($con,"insert into tbl_distributor_stock(distributor_id,product_id,opening_stock,closing_stock,date, time)values('$ver','$proid','0','-$pquanity','$billdate1','$scri')");
				$uq1=mysqli_query($con,"UPDATE tbl_product SET stock_quantity=round(stock_quantity-'$pquanity',2),tb_updatedatetime='$da' where product_id='$proid' and distributor_id='$ver'");
			}
		}	
	}	
	// $action_history = mysqli_query($con, "INSERT INTO `tbl_btcw_bthawk_access_logs` (`client_id`, `action_name`, `action_at`, `action_from`, `ip_address`, `inserted_at`, `updated_at`) VALUES ('$ver', 'INSERT OPERATION,Add Stock Insert and Reduce#Admin(INSERT+UPDATE) tbl_distributor_stock,tbl_distributor_stock_add_reduce,tbl_product_serialno#(UPDATE)tbl_product', current_timestamp(), 'App', '$ipaddress', current_timestamp(), '0000-00-00 00:00:00.000000')");
	$response['success']='1';
	$response['details']="Stock successfully Updated!";
}
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>